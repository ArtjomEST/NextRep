import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
  users,
} from '@/lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetRow {
  setIndex: number;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  completed: boolean;
}

interface ExerciseRow {
  weId: string;
  exerciseName: string;
  category: string | null;
  primaryMuscles: string[] | null;
  secondaryMuscles: string[] | null;
  measurementType: string;
  order: number;
  status: string;
  sets: SetRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDurationPdf(sec: number | null): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function formatDatePdf(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Collect all unique muscles from exercises
function collectMuscles(exRows: ExerciseRow[]): {
  primary: string[];
  secondary: string[];
} {
  const primary = new Set<string>();
  const secondary = new Set<string>();
  for (const ex of exRows) {
    for (const m of ex.primaryMuscles ?? []) primary.add(m);
    for (const m of ex.secondaryMuscles ?? []) secondary.add(m);
  }
  // Remove muscles that appear in primary from secondary
  for (const m of primary) secondary.delete(m);
  return { primary: [...primary], secondary: [...secondary] };
}

// ─── PDF Builder ─────────────────────────────────────────────────────────────

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Colors
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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  // PDFKit doesn't support rgba in fill; use opacity separately
  // We store as hex for fill and handle opacity via doc.opacity
  void alpha;
  return `rgb(${r},${g},${b})`;
}
void withAlpha;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPdf(doc: any, data: {
  workoutName: string;
  createdAt: string;
  startedAt: string | null;
  durationSec: number | null;
  totalVolume: number;
  totalSets: number;
  notes: string | null;
  exercises: ExerciseRow[];
  userName: string;
}): void {
  const { workoutName, createdAt, startedAt, durationSec, totalVolume, totalSets, notes, exercises: exRows, userName } = data;

  // Track current Y position
  let y = 0;

  // ── Fill page background ──────────────────────────────────────────────────
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
  const HEADER_H = 56;
  doc.save();
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(C.card);
  doc.restore();

  // "NextRep" logo
  doc.save();
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(18);
  doc.text('NextRep', MARGIN, 18, { lineBreak: false });
  doc.restore();

  // Username (right-aligned)
  doc.save();
  doc.fillColor(C.textSecondary).font('Helvetica').fontSize(10);
  doc.text(userName, MARGIN, 22, { width: CONTENT_W, align: 'right', lineBreak: false });
  doc.restore();

  y = HEADER_H + 24;

  // ── Workout name & date ───────────────────────────────────────────────────
  doc.save();
  doc.fillColor(C.textPrimary).font('Helvetica-Bold').fontSize(22);
  doc.text(workoutName, MARGIN, y, { width: CONTENT_W });
  y = doc.y + 6;
  doc.restore();

  const dateStr = formatDatePdf(startedAt ?? createdAt);
  const durStr = formatDurationPdf(durationSec);
  doc.save();
  doc.fillColor(C.textSecondary).font('Helvetica').fontSize(11);
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

    // Label
    doc.save();
    doc.fillColor(C.textSecondary).font('Helvetica').fontSize(9);
    doc.text(statCards[i].label, cx + 12, y + 12, { width: STAT_CARD_W - 24, lineBreak: false });
    doc.restore();

    // Value
    doc.save();
    doc.fillColor(C.textPrimary).font('Helvetica-Bold').fontSize(16);
    doc.text(statCards[i].value, cx + 12, y + 28, { width: STAT_CARD_W - 24, lineBreak: false });
    doc.restore();
  }

  y += STAT_CARD_H + 24;

  // ── Muscles section ───────────────────────────────────────────────────────
  const { primary, secondary } = collectMuscles(exRows);

  if (primary.length > 0 || secondary.length > 0) {
    doc.save();
    doc.fillColor(C.textPrimary).font('Helvetica-Bold').fontSize(13);
    doc.text('Muscles Worked', MARGIN, y);
    y = doc.y + 8;
    doc.restore();

    // Pills
    const PILL_H = 20;
    const PILL_PAD_X = 9;
    const PILL_GAP = 6;
    let pillX = MARGIN;

    function drawPill(label: string, isPrimary: boolean) {
      const textColor = isPrimary ? C.success : C.textSecondary;
      const borderColor = isPrimary ? C.primary : C.border;

      // Measure approximate text width
      const approxW = label.length * 5.5 + PILL_PAD_X * 2;

      if (pillX + approxW > MARGIN + CONTENT_W) {
        pillX = MARGIN;
        y += PILL_H + PILL_GAP;
      }

      doc.save();
      doc.roundedRect(pillX, y, approxW, PILL_H, 5).fill(C.card);
      doc.roundedRect(pillX, y, approxW, PILL_H, 5).stroke(borderColor);
      doc.restore();

      doc.save();
      doc.fillColor(textColor).font('Helvetica').fontSize(9);
      doc.text(label, pillX + PILL_PAD_X, y + 5, { lineBreak: false });
      doc.restore();

      pillX += approxW + PILL_GAP;
    }

    for (const m of primary) drawPill(m, true);
    for (const m of secondary) drawPill(m, false);

    y += PILL_H + 20;
    pillX = MARGIN;
    void pillX;
  }

  // ── Exercises ─────────────────────────────────────────────────────────────
  doc.save();
  doc.fillColor(C.textPrimary).font('Helvetica-Bold').fontSize(13);
  doc.text('Exercises', MARGIN, y);
  y = doc.y + 12;
  doc.restore();

  for (let i = 0; i < exRows.length; i++) {
    const ex = exRows[i];

    // Check if we need a new page (rough estimate)
    const estimatedH = 40 + ex.sets.length * 22 + 16;
    if (y + estimatedH > PAGE_H - 60) {
      doc.addPage();
      // pageAdded event handles fillBackground and resets y to MARGIN
    }

    // Exercise header background
    doc.save();
    doc.rect(MARGIN, y, CONTENT_W, 36).fill(C.surface);
    doc.restore();

    // Exercise number + name
    doc.save();
    doc.fillColor(C.textPrimary).font('Helvetica-Bold').fontSize(12);
    doc.text(`${i + 1}. ${ex.exerciseName}`, MARGIN + 12, y + 8, {
      width: CONTENT_W - 24 - 80,
      lineBreak: false,
      ellipsis: true,
    });
    doc.restore();

    // Category badge (right side)
    if (ex.category) {
      doc.save();
      doc.fillColor(C.primary).font('Helvetica').fontSize(9);
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
    doc.fillColor(C.textMuted).font('Helvetica').fontSize(9);
    doc.text('SET', COL.set, y + 4, { lineBreak: false });
    doc.text('WEIGHT', COL.weight, y + 4, { lineBreak: false });
    doc.text('REPS', COL.reps, y + 4, { lineBreak: false });
    doc.text('✓', COL.status, y + 4, { lineBreak: false });
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
          ? s.seconds != null ? `${s.seconds}s` : '—'
          : s.reps != null ? String(s.reps) : '—';

      const rowOpacity = s.completed ? 1 : 0.45;

      doc.save();
      doc.opacity(rowOpacity);
      doc.fillColor(C.textSecondary).font('Helvetica').fontSize(11);
      doc.text(String(s.setIndex), COL.set, y, { lineBreak: false });
      doc.fillColor(C.textPrimary);
      doc.text(weightStr, COL.weight, y, { lineBreak: false });
      doc.text(repsStr, COL.reps, y, { lineBreak: false });
      if (s.completed) {
        doc.fillColor(C.success);
        doc.text('✓', COL.status, y, { lineBreak: false });
      }
      doc.restore();

      y += 18;
    }

    y += 8;

    // Separator between exercises
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
    doc.fillColor(C.textPrimary).font('Helvetica-Bold').fontSize(11);
    doc.text('Notes', MARGIN, y);
    y = doc.y + 6;
    doc.restore();

    doc.save();
    doc.fillColor(C.textSecondary).font('Helvetica-Oblique').fontSize(10);
    doc.text(notes.trim(), MARGIN, y, { width: CONTENT_W });
    y = doc.y + 8;
    doc.restore();
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  // Always place footer at bottom of last page
  const FOOTER_Y = PAGE_H - 40;
  doc.save();
  doc.moveTo(MARGIN, FOOTER_Y - 10).lineTo(MARGIN + CONTENT_W, FOOTER_Y - 10).stroke(C.border);
  doc.fillColor(C.textMuted).font('Helvetica').fontSize(8);
  doc.text(
    `Generated by NextRep  •  ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    MARGIN,
    FOOTER_Y,
    { width: CONTENT_W, align: 'center', lineBreak: false },
  );
  doc.restore();
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Load workout
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    if (workout.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Load user info
    const [user] = await db
      .select({ username: users.username, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const userName = user?.username
      ? `@${user.username}`
      : [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

    // Load exercises
    const weRows = await db
      .select({
        weId: workoutExercises.id,
        exerciseName: exercises.name,
        category: exercises.category,
        primaryMuscles: exercises.primaryMuscles,
        secondaryMuscles: exercises.secondaryMuscles,
        measurementType: exercises.measurementType,
        order: workoutExercises.order,
        status: workoutExercises.status,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(asc(workoutExercises.order));

    const weIds = weRows.map((r) => r.weId);

    const setsMap = new Map<string, SetRow[]>();

    if (weIds.length > 0) {
      const allSets = await db
        .select({
          workoutExerciseId: workoutSets.workoutExerciseId,
          setIndex: workoutSets.setIndex,
          weight: workoutSets.weight,
          reps: workoutSets.reps,
          seconds: workoutSets.seconds,
          completed: workoutSets.completed,
        })
        .from(workoutSets)
        .where(inArray(workoutSets.workoutExerciseId, weIds))
        .orderBy(asc(workoutSets.setIndex));

      for (const s of allSets) {
        const arr = setsMap.get(s.workoutExerciseId) ?? [];
        arr.push({
          setIndex: s.setIndex,
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.reps,
          seconds: s.seconds,
          completed: s.completed,
        });
        setsMap.set(s.workoutExerciseId, arr);
      }
    }

    const exRows: ExerciseRow[] = weRows.map((r) => ({
      weId: r.weId,
      exerciseName: r.exerciseName,
      category: r.category,
      primaryMuscles: Array.isArray(r.primaryMuscles) ? r.primaryMuscles as string[] : [],
      secondaryMuscles: Array.isArray(r.secondaryMuscles) ? r.secondaryMuscles as string[] : [],
      measurementType: r.measurementType,
      order: r.order,
      status: r.status,
      sets: setsMap.get(r.weId) ?? [],
    }));

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    buildPdf(doc, {
      workoutName: workout.name,
      createdAt: workout.createdAt.toISOString(),
      startedAt: workout.startedAt?.toISOString() ?? null,
      durationSec: workout.durationSec,
      totalVolume: Number(workout.totalVolume ?? 0),
      totalSets: workout.totalSets ?? 0,
      notes: workout.notes,
      exercises: exRows,
      userName,
    });

    await new Promise<void>((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    const dateStr = (workout.startedAt ?? workout.createdAt)
      .toISOString()
      .slice(0, 10);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nextrep-workout-${dateStr}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error('GET /api/workouts/[id]/export error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF', message: String(err) },
      { status: 500 },
    );
  }
}
