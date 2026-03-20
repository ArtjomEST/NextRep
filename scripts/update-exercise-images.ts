import { list } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';

const BLOB_TOKEN =
  'vercel_blob_rw_XMebriJ6Ou8UqSds_9v9wcZDIk2ZYMMOrxAZeZpafsy9joD';
const DATABASE_URL =
  'postgresql://neondb_owner:npg_6dcZ8WvyHQMz@ep-damp-frog-agvew4lp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

type ExerciseRow = { id: string; name: string };

const sql = neon(DATABASE_URL);

function toTitleCase(words: string): string {
  return words
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Last path segment without extension; hyphens/underscores → spaces; title case. */
function deriveNameFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const filename = segments[segments.length - 1];
  if (!filename || !IMAGE_EXT.test(filename)) return null;
  const base = filename.replace(IMAGE_EXT, '');
  const spaced = base.replace(/[-_]+/g, ' ').trim();
  if (!spaced) return null;
  return toTitleCase(spaced);
}

async function fetchAllExerciseBlobs() {
  const blobs: Awaited<ReturnType<typeof list>>['blobs'] = [];
  let cursor: string | undefined;

  for (;;) {
    const page = await list({
      prefix: 'exercises/',
      token: BLOB_TOKEN,
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });
    blobs.push(...page.blobs);
    if (!page.hasMore) break;
    if (!page.cursor) break;
    cursor = page.cursor;
  }

  return blobs;
}

async function findExercise(derivedName: string): Promise<ExerciseRow | null> {
  const exact = await sql`
    SELECT id, name FROM exercises
    WHERE LOWER(name) = LOWER(${derivedName})
    LIMIT 1
  `;
  if (exact.length > 0) {
    return exact[0] as ExerciseRow;
  }

  const likePattern = `%${derivedName.toLowerCase()}%`;
  const partial = await sql`
    SELECT id, name FROM exercises
    WHERE LOWER(name) LIKE ${likePattern}
    LIMIT 1
  `;
  if (partial.length > 0) {
    return partial[0] as ExerciseRow;
  }

  return null;
}

function isImageBlobPathname(pathname: string): boolean {
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  return IMAGE_EXT.test(last);
}

async function main() {
  const raw = await fetchAllExerciseBlobs();
  const blobs = raw.filter((b) => isImageBlobPathname(b.pathname));
  if (raw.length !== blobs.length) {
    console.log(
      `Note: skipped ${raw.length - blobs.length} prefix entries (no image filename).\n`,
    );
  }
  console.log(`Found ${blobs.length} files in Blob store\n`);

  let updated = 0;
  let unmatched = 0;

  for (const blob of blobs) {
    const derived = deriveNameFromPathname(blob.pathname);
    if (!derived) {
      console.log(`✗ Skip (not a recognized image path): ${blob.pathname}`);
      unmatched++;
      continue;
    }

    const row = await findExercise(derived);
    if (!row) {
      console.log(`✗ No match: "${derived}"`);
      unmatched++;
      continue;
    }

    await sql`
      UPDATE exercises
      SET image_url = ${blob.url}
      WHERE id = ${row.id}
    `;
    updated++;
    console.log(`✓ ${row.name} → ${blob.url}`);
  }

  console.log('─────────────────────────────────────');
  console.log(`Updated: ${updated}/${blobs.length}`);
  console.log(`Unmatched: ${unmatched}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
