import path from 'path';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

// ─── Font buffers ─────────────────────────────────────────────────────────────
// Read at module level so Next.js file tracing detects them and includes them
// in the serverless bundle. Buffers are passed directly to pdfkit so there is
// no filesystem dependency at request time.

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');
const FONT_REGULAR = fs.readFileSync(path.join(FONTS_DIR, 'DejaVuSans.ttf'));
const FONT_BOLD = fs.readFileSync(path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfSetRow {
  setIndex: number;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  completed: boolean;
}

export interface PdfExerciseRow {
  weId: string;
  exerciseName: string;
  category: string | null;
  primaryMuscles: string[] | null;
  secondaryMuscles: string[] | null;
  measurementType: string;
  order: number;
  status: string;
  sets: PdfSetRow[];
}

export interface WorkoutPdfData {
  workoutName: string;
  createdAt: string;
  startedAt: string | null;
  durationSec: number | null;
  totalVolume: number;
  totalSets: number;
  notes: string | null;
  exercises: PdfExerciseRow[];
  userName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDurationPdf(sec: number | null): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function formatDatePdf(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function collectMuscles(exRows: PdfExerciseRow[]): {
  primary: string[];
  secondary: string[];
} {
  const primary = new Set<string>();
  const secondary = new Set<string>();
  for (const ex of exRows) {
    for (const m of ex.primaryMuscles ?? []) primary.add(m);
    for (const m of ex.secondaryMuscles ?? []) secondary.add(m);
  }
  for (const m of primary) secondary.delete(m);
  return { primary: [...primary], secondary: [...secondary] };
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const C = {
  bg: '#0E1114',
  surface: '#161B20',
  card: '#1C2228',
  border: '#262E36',
  primary: '#1F8A5B',
  success: '#22C55E',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

// ─── PDF builder ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPdf(doc: any, data: WorkoutPdfData): void {
  const {
    workoutName,
    createdAt,
    startedAt,
    durationSec,
    totalVolume,
    totalSets,
    notes,
    exercises: exRows,
    userName,
  } = data;

  // Register fonts with Cyrillic support
  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold', FONT_BOLD);

  let y = 0;

  // ── Background fill (first page + each new page) ──────────────────────────
  function fillBackground() {
    doc.save();
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.bg);
    doc.restore();
  }

  doc.on('pageAdded', () => {
    fillBackground();
    y = MARGIN;
  });
  fillBackground();
  y = 0;

  // ── Header bar ────────────────────────────────────────────────────────────
  const HEADER_H = 60;
  doc.save();
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(C.card);
  doc.restore();

  // Logo: green rounded square with "N"
  const LOGO_SIZE = 28;
  const LOGO_X = MARGIN;
  const LOGO_Y = (HEADER_H - LOGO_SIZE) / 2;

  doc.save();
  doc.roundedRect(LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE, 6).fill(C.primary);
  doc.fillColor('#FFFFFF').font('Bold').fontSize(16);
  doc.text('N', LOGO_X, LOGO_Y + 5, { width: LOGO_SIZE, align: 'center', lineBreak: false });
  doc.restore();

  // "NextRep" text next to logo
  doc.save();
  doc.fillColor(C.primary).font('Bold').fontSize(16);
  doc.text('NextRep', LOGO_X + LOGO_SIZE + 8, LOGO_Y + 7, { lineBreak: false });
  doc.restore();

  // Username (right-aligned)
  doc.save();
  doc.fillColor(C.textSecondary).font('Regular').fontSize(10);
  doc.text(userName, MARGIN, LOGO_Y + 9, { width: CONTENT_W, align: 'right', lineBreak: false });
  doc.restore();

  y = HEADER_H + 24;

  // ── Workout name & date ───────────────────────────────────────────────────
  doc.save();
  doc.fillColor(C.textPrimary).font('Bold').fontSize(22);
  doc.text(workoutName, MARGIN, y, { width: CONTENT_W });
  y = doc.y + 6;
  doc.restore();

  const dateStr = formatDatePdf(startedAt ?? createdAt);
  const durStr = formatDurationPdf(durationSec);
  doc.save();
  doc.fillColor(C.textSecondary).font('Regular').fontSize(11);
  doc.text(`${dateStr}  ·  ${durStr}`, MARGIN, y, { width: CONTENT_W });
  y = doc.y + 20;
  doc.restore();

  // ── Stats cards (3 in a row) ──────────────────────────────────────────────
  const STAT_CARD_W = (CONTENT_W - 16) / 3;
  const STAT_CARD_H = 62;
  const statCards = [
    { label: 'VOLUME', value: `${totalVolume.toLocaleString('en-US')} kg` },
    { label: 'SETS', value: String(totalSets) },
    { label: 'EXERCISES', value: String(exRows.length) },
  ];

  for (let i = 0; i < statCards.length; i++) {
    const cx = MARGIN + i * (STAT_CARD_W + 8);

    doc.save();
    doc.roundedRect(cx, y, STAT_CARD_W, STAT_CARD_H, 8).fill(C.card);
    doc.roundedRect(cx, y, STAT_CARD_W, STAT_CARD_H, 8).stroke(C.border);
    doc.restore();

    doc.save();
    doc.fillColor(C.textSecondary).font('Regular').fontSize(9);
    doc.text(statCards[i].label, cx + 12, y + 12, { width: STAT_CARD_W - 24, lineBreak: false });
    doc.restore();

    doc.save();
    doc.fillColor(C.textPrimary).font('Bold').fontSize(16);
    doc.text(statCards[i].value, cx + 12, y + 28, { width: STAT_CARD_W - 24, lineBreak: false });
    doc.restore();
  }

  y += STAT_CARD_H + 24;

  // ── Muscles section ───────────────────────────────────────────────────────
  const { primary, secondary } = collectMuscles(exRows);

  if (primary.length > 0 || secondary.length > 0) {
    doc.save();
    doc.fillColor(C.textPrimary).font('Bold').fontSize(13);
    doc.text('Muscles Worked', MARGIN, y);
    y = doc.y + 8;
    doc.restore();

    const PILL_H = 20;
    const PILL_PAD_X = 9;
    const PILL_GAP = 6;
    let pillX = MARGIN;

    function drawPill(label: string, isPrimary: boolean) {
      const textColor = isPrimary ? C.success : C.textSecondary;
      const borderColor = isPrimary ? C.primary : C.border;

      // Measure actual text width using pdfkit
      doc.font(isPrimary ? 'Bold' : 'Regular').fontSize(9);
      const textWidth = doc.widthOfString(label);
      const pillW = textWidth + PILL_PAD_X * 2 + 4;

      if (pillX + pillW > MARGIN + CONTENT_W) {
        pillX = MARGIN;
        y += PILL_H + PILL_GAP;
      }

      doc.save();
      doc.roundedRect(pillX, y, pillW, PILL_H, 5).fill(C.card);
      doc.roundedRect(pillX, y, pillW, PILL_H, 5).stroke(borderColor);
      doc.restore();

      doc.save();
      doc.fillColor(textColor).font(isPrimary ? 'Bold' : 'Regular').fontSize(9);
      doc.text(label, pillX + PILL_PAD_X, y + 5, { lineBreak: false });
      doc.restore();

      pillX += pillW + PILL_GAP;
    }

    for (const m of primary) drawPill(m, true);
    for (const m of secondary) drawPill(m, false);

    y += PILL_H + 20;
  }

  // ── Exercises ─────────────────────────────────────────────────────────────
  doc.save();
  doc.fillColor(C.textPrimary).font('Bold').fontSize(13);
  doc.text('Exercises', MARGIN, y);
  y = doc.y + 12;
  doc.restore();

  for (let i = 0; i < exRows.length; i++) {
    const ex = exRows[i];

    const estimatedH = 40 + ex.sets.length * 22 + 16;
    if (y + estimatedH > PAGE_H - 60) {
      doc.addPage();
    }

    // Exercise header background
    doc.save();
    doc.rect(MARGIN, y, CONTENT_W, 36).fill(C.surface);
    doc.restore();

    // Exercise number + name
    doc.save();
    doc.fillColor(C.textPrimary).font('Bold').fontSize(12);
    doc.text(`${i + 1}. ${ex.exerciseName}`, MARGIN + 12, y + 8, {
      width: CONTENT_W - 24 - 80,
      lineBreak: false,
      ellipsis: true,
    });
    doc.restore();

    // Category badge (right side)
    if (ex.category) {
      doc.save();
      doc.fillColor(C.primary).font('Regular').fontSize(9);
      doc.text(ex.category.toUpperCase(), MARGIN + CONTENT_W - 80, y + 11, {
        width: 68,
        align: 'right',
        lineBreak: false,
      });
      doc.restore();
    }

    y += 36;

    // Sets table header
    const COL = {
      set: MARGIN + 12,
      weight: MARGIN + 50,
      reps: MARGIN + 150,
      status: MARGIN + CONTENT_W - 30,
    };

    doc.save();
    doc.fillColor(C.textMuted).font('Regular').fontSize(9);
    doc.text('SET', COL.set, y + 4, { lineBreak: false });
    doc.text('WEIGHT', COL.weight, y + 4, { lineBreak: false });
    doc.text('REPS', COL.reps, y + 4, { lineBreak: false });
    doc.text('v', COL.status, y + 4, { lineBreak: false });
    doc.restore();
    y += 18;

    // Separator
    doc.save();
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).stroke(C.border);
    doc.restore();
    y += 6;

    // Sets rows
    for (const s of ex.sets) {
      const weightStr =
        s.weight != null && s.weight > 0 ? `${s.weight} kg` : '—';
      const repsStr =
        ex.measurementType === 'time'
          ? s.seconds != null
            ? `${s.seconds}s`
            : '—'
          : s.reps != null
            ? String(s.reps)
            : '—';

      doc.save();
      doc.opacity(s.completed ? 1 : 0.45);
      doc.fillColor(C.textSecondary).font('Regular').fontSize(11);
      doc.text(String(s.setIndex), COL.set, y, { lineBreak: false });
      doc.fillColor(C.textPrimary);
      doc.text(weightStr, COL.weight, y, { lineBreak: false });
      doc.text(repsStr, COL.reps, y, { lineBreak: false });
      if (s.completed) {
        doc.fillColor(C.success);
        doc.text('+', COL.status, y, { lineBreak: false });
      }
      doc.restore();

      y += 18;
    }

    y += 8;

    if (i < exRows.length - 1) {
      doc.save();
      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).stroke(C.border);
      doc.restore();
      y += 16;
    }
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (notes?.trim()) {
    y += 8;
    if (y + 80 > PAGE_H - 60) {
      doc.addPage();
    }
    doc.save();
    doc.fillColor(C.textPrimary).font('Bold').fontSize(11);
    doc.text('Notes', MARGIN, y);
    y = doc.y + 6;
    doc.restore();

    doc.save();
    doc.fillColor(C.textSecondary).font('Regular').fontSize(10);
    doc.text(notes.trim(), MARGIN, y, { width: CONTENT_W });
    doc.restore();
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const FOOTER_Y = PAGE_H - 40;
  doc.save();
  doc.moveTo(MARGIN, FOOTER_Y - 10).lineTo(MARGIN + CONTENT_W, FOOTER_Y - 10).stroke(C.border);
  doc.fillColor(C.textMuted).font('Regular').fontSize(8);
  doc.text(
    `Generated by NextRep  •  ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    MARGIN,
    FOOTER_Y,
    { width: CONTENT_W, align: 'center', lineBreak: false },
  );
  doc.restore();
}

// ─── Public: generate PDF buffer ──────────────────────────────────────────────

export async function buildWorkoutPdfBuffer(data: WorkoutPdfData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  buildPdf(doc, data);

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
    doc.end();
  });

  return Buffer.concat(chunks);
}
