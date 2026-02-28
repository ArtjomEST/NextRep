import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { exercises } from '../lib/db/schema/exercises';
import { eq, and } from 'drizzle-orm';

// ─── Config ────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const WGER_BASE = process.env.WGER_BASE_URL ?? 'https://wger.de/api/v2';
const WGER_TOKEN = process.env.WGER_API_TOKEN;
const LANGUAGE_ID = 2; // English
const PAGE_SIZE = 50;
const PAGE_DELAY_MS = 500;

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient);

// ─── wger API types ────────────────────────────────────────

interface WgerPaginated<T> {
  count: number;
  next: string | null;
  results: T[];
}

interface WgerTranslation {
  id: number;
  name: string;
  description: string;
  language: number;
}

interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
}

interface WgerEquipment {
  id: number;
  name: string;
}

interface WgerCategory {
  id: number;
  name: string;
}

interface WgerImage {
  id: number;
  image: string;
  is_main: boolean;
}

interface WgerExerciseInfo {
  id: number;
  uuid: string;
  category: WgerCategory;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  translations: WgerTranslation[];
  images: WgerImage[];
}

// ─── Helpers ───────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function apiHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (WGER_TOKEN) h['Authorization'] = `Token ${WGER_TOKEN}`;
  return h;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: apiHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

type MeasurementType = 'weight_reps' | 'reps_only' | 'time';

function inferMeasurementType(name: string, categoryName: string): MeasurementType {
  const ln = name.toLowerCase();
  if (/\b(plank|hold|wall sit|l-sit|dead hang)\b/.test(ln)) return 'time';

  const lc = categoryName.toLowerCase();
  if (lc === 'abs' || lc === 'abdominals') {
    if (/\b(crunch|sit.?up|leg raise|flutter|bicycle|v.?up)\b/.test(ln)) return 'reps_only';
  }
  if (/\b(push.?up|pull.?up|chin.?up|dip|muscle.?up|burpee|jumping jack)\b/.test(ln)) return 'reps_only';

  return 'weight_reps';
}

function mapCategory(name: string): string {
  const map: Record<string, string> = {
    Arms: 'Arms', Legs: 'Legs', Abs: 'Core', Chest: 'Chest',
    Back: 'Back', Shoulders: 'Shoulders', Calves: 'Legs',
    Cardio: 'Cardio', Stretching: 'Stretching',
  };
  return map[name] ?? name;
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       NextRep — wger Exercise Importer       ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  let totalFetched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let withImages = 0;
  let pageNum = 0;

  let url: string | null = `${WGER_BASE}/exerciseinfo/?format=json&limit=${PAGE_SIZE}`;

  while (url) {
    pageNum++;
    console.log(`→ Page ${pageNum} (${url.split('?')[0]}...)`);

    let page: WgerPaginated<WgerExerciseInfo>;
    try {
      page = await fetchJson<WgerPaginated<WgerExerciseInfo>>(url);
    } catch (err) {
      console.error(`  ✗ Failed to fetch page: ${err}`);
      break;
    }

    if (pageNum === 1) console.log(`  Total available: ${page.count}`);

    for (const ex of page.results) {
      totalFetched++;

      // Find English translation
      const enTrans = ex.translations.find((t) => t.language === LANGUAGE_ID);
      const name = enTrans?.name?.trim();
      if (!name || name.length === 0) {
        skipped++;
        continue;
      }

      const catName = ex.category?.name ?? 'Other';
      const description = enTrans?.description ? stripHtml(enTrans.description) : null;

      const primaryMuscles = ex.muscles
        .map((m) => m.name_en || m.name)
        .filter(Boolean);
      const secondaryMuscles = ex.muscles_secondary
        .map((m) => m.name_en || m.name)
        .filter(Boolean);
      const equipmentNames = ex.equipment
        .map((e) => e.name)
        .filter(Boolean);

      const mainImg = ex.images.find((i) => i.is_main);
      const imageUrl = mainImg?.image ?? ex.images[0]?.image ?? null;
      const allImages = ex.images.map((i) => i.image).filter(Boolean);
      if (allImages.length > 0) withImages++;

      const measurementType = inferMeasurementType(name, catName);
      const category = mapCategory(catName);

      const values = {
        source: 'wger' as const,
        sourceId: ex.id,
        name,
        description: description && description.length > 0 ? description : null,
        primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : null,
        secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : null,
        equipment: equipmentNames.length > 0 ? equipmentNames : null,
        category,
        measurementType,
        imageUrl,
        images: allImages.length > 0 ? allImages : null,
        updatedAt: new Date(),
      };

      try {
        const existing = await db
          .select({ id: exercises.id })
          .from(exercises)
          .where(and(eq(exercises.source, 'wger'), eq(exercises.sourceId, ex.id)))
          .limit(1);

        if (existing.length > 0) {
          await db.update(exercises).set(values).where(eq(exercises.id, existing[0].id));
          updated++;
        } else {
          await db.insert(exercises).values(values);
          inserted++;
        }
      } catch (err) {
        console.error(`  ✗ DB error for "${name}" (wger #${ex.id}): ${err}`);
        skipped++;
      }
    }

    console.log(`  processed ${page.results.length} exercises (running: +${inserted} ins, +${updated} upd, ${skipped} skip)`);
    url = page.next;
    if (url) await sleep(PAGE_DELAY_MS);
  }

  console.log();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║                  Summary                     ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Total fetched:  ${String(totalFetched).padStart(6)}                     ║`);
  console.log(`║  Inserted:       ${String(inserted).padStart(6)}                     ║`);
  console.log(`║  Updated:        ${String(updated).padStart(6)}                     ║`);
  console.log(`║  Skipped:        ${String(skipped).padStart(6)}                     ║`);
  console.log(`║  With images:    ${String(withImages).padStart(6)}                     ║`);
  console.log('╚══════════════════════════════════════════════╝');
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
