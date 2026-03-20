import { list } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';

const BLOB_TOKEN =
  'vercel_blob_rw_XMebriJ6Ou8UqSds_9v9wcZDIk2ZYMMOrxAZeZpafsy9joD';
const DATABASE_URL =
  'postgresql://neondb_owner:npg_6dcZ8WvyHQMz@ep-damp-frog-agvew4lp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

type ExerciseRow = { id: string; name: string; image_url: string };
type ListBlob = Awaited<ReturnType<typeof list>>['blobs'][number];

const sql = neon(DATABASE_URL);

function toTitleCase(words: string): string {
  return words
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function deriveNameFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const filename = segments[segments.length - 1];
  if (!filename || !IMAGE_EXT.test(filename)) return null;
  const base = filename.replace(IMAGE_EXT, '');
  const spaced = base.replace(/[-_]+/g, ' ').trim();
  if (!spaced) return null;
  return toTitleCase(spaced);
}

function isImageBlobPathname(pathname: string): boolean {
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  return IMAGE_EXT.test(last);
}

function fileStem(filename: string): string {
  return filename.replace(IMAGE_EXT, '');
}

/** Compare stems ignoring hyphens, underscores, spaces, case. */
function normalizeStem(stem: string): string {
  return stem.replace(/[-_\s]+/g, '-').toLowerCase();
}

const EXT_PRIORITY = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

function extensionRank(pathname: string): number {
  const lower = pathname.toLowerCase();
  const i = EXT_PRIORITY.findIndex((e) => lower.endsWith(e));
  return i === -1 ? EXT_PRIORITY.length : i;
}

async function fetchAllExerciseBlobs(): Promise<ListBlob[]> {
  const raw: ListBlob[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await list({
      prefix: 'exercises/',
      token: BLOB_TOKEN,
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });
    raw.push(...page.blobs);
    if (!page.hasMore) break;
    if (!page.cursor) break;
    cursor = page.cursor;
  }
  return raw.filter((b) => isImageBlobPathname(b.pathname));
}

/**
 * If image_url points at this Blob store but path casing/encoding/extension
 * differs from list() results, return the canonical blob (HEAD often 404).
 */
function findCanonicalBlobForStoredUrl(
  imageUrl: string,
  blobs: ListBlob[],
): ListBlob | null {
  let pathLast: string;
  try {
    const u = new URL(imageUrl);
    if (!u.hostname.endsWith('.public.blob.vercel-storage.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    const raw = parts[parts.length - 1];
    if (!raw || !IMAGE_EXT.test(raw)) return null;
    pathLast = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const lower = pathLast.toLowerCase();

  const exact = blobs.find((b) => {
    const seg = b.pathname.split('/').filter(Boolean).pop();
    if (!seg) return false;
    return decodeURIComponent(seg).toLowerCase() === lower;
  });
  if (exact) return exact;

  const stemKey = normalizeStem(fileStem(pathLast));
  const stemMatches = blobs.filter((b) => {
    const seg = b.pathname.split('/').filter(Boolean).pop();
    if (!seg || !IMAGE_EXT.test(seg)) return false;
    return normalizeStem(fileStem(decodeURIComponent(seg))) === stemKey;
  });
  if (stemMatches.length === 0) return null;

  stemMatches.sort((a, b) => extensionRank(a.pathname) - extensionRank(b.pathname));
  return stemMatches[0];
}

/** Same rules as update script: exact name, then LOWER(name) LIKE %derived%. */
function findBlobForExercise(exerciseName: string, blobs: ListBlob[]): ListBlob | null {
  const withDerived = blobs
    .map((b) => ({ blob: b, derived: deriveNameFromPathname(b.pathname) }))
    .filter((x): x is { blob: ListBlob; derived: string } => x.derived !== null);

  const exLower = exerciseName.toLowerCase();

  const exact = withDerived.find(
    (x) => x.derived.toLowerCase() === exLower,
  );
  if (exact) return exact.blob;

  const partials = withDerived.filter((x) =>
    exLower.includes(x.derived.toLowerCase()),
  );
  if (partials.length === 0) return null;

  partials.sort((a, b) => b.derived.length - a.derived.length);
  return partials[0].blob;
}

async function headOk(url: string): Promise<boolean> {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  return res.ok;
}

async function main() {
  const exercises = (await sql`
    SELECT id, name, image_url
    FROM exercises
    WHERE image_url IS NOT NULL
  `) as ExerciseRow[];

  const blobs = await fetchAllExerciseBlobs();

  const urlByExerciseId = new Map<string, string>();
  for (const ex of exercises) {
    urlByExerciseId.set(ex.id, ex.image_url);
  }

  const accessibility = new Map<string, boolean>();
  for (const ex of exercises) {
    const ok = await headOk(ex.image_url);
    accessibility.set(ex.id, ok);
  }

  const fixed: { id: string; name: string; newUrl: string }[] = [];

  for (const ex of exercises) {
    if (accessibility.get(ex.id)) continue;

    const candidate =
      findCanonicalBlobForStoredUrl(ex.image_url, blobs) ??
      findBlobForExercise(ex.name, blobs);
    if (!candidate || candidate.url === ex.image_url) continue;

    await sql`
      UPDATE exercises
      SET image_url = ${candidate.url}
      WHERE id = ${ex.id}
    `;
    urlByExerciseId.set(ex.id, candidate.url);
    const newOk = await headOk(candidate.url);
    accessibility.set(ex.id, newOk);
    fixed.push({ id: ex.id, name: ex.name, newUrl: candidate.url });
  }

  const usedUrls = new Set(urlByExerciseId.values());
  const unusedBlobs = blobs.filter((b) => !usedUrls.has(b.url));

  const stillBroken: ExerciseRow[] = [];
  const okExercises: ExerciseRow[] = [];

  for (const ex of exercises) {
    const url = urlByExerciseId.get(ex.id) ?? ex.image_url;
    const row = { ...ex, image_url: url };
    if (accessibility.get(ex.id)) {
      okExercises.push(row);
    } else {
      stillBroken.push(row);
    }
  }

  console.log('=== BROKEN URLs (in DB but not accessible) ===');
  if (stillBroken.length === 0) {
    console.log('(none)\n');
  } else {
    for (const ex of stillBroken) {
      console.log(`✗ ${ex.name} → ${ex.image_url}`);
    }
    console.log('');
  }

  console.log('=== UNUSED FILES (in Blob but not linked to any exercise) ===');
  if (unusedBlobs.length === 0) {
    console.log('(none)\n');
  } else {
    for (const b of unusedBlobs) {
      console.log(`→ ${b.url}  (not used by any exercise)`);
    }
    console.log('');
  }

  console.log('=== OK ===');
  for (const ex of okExercises) {
    console.log(`✓ ${ex.name} → ${ex.image_url}`);
  }
  console.log('');

  const working = okExercises.length;
  const broken = stillBroken.length;

  console.log('=== SUMMARY ===');
  console.log(`Total with image_url: ${exercises.length}`);
  console.log(`Working: ${working}`);
  console.log(`Broken: ${broken}`);
  console.log(`Unused blobs: ${unusedBlobs.length}`);
  if (fixed.length > 0) {
    console.log(`Auto-fixed (DB updated): ${fixed.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
