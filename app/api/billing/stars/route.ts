import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/helpers';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    if (!BOT_TOKEN) return NextResponse.json({ error: 'Bot not configured' }, { status: 503 });

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'NextRep PRO',
        description: '30 days of AI Coach + workout reports',
        payload: auth.userId,
        currency: 'XTR',
        prices: [{ label: 'PRO 30 days', amount: 50 }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[billing/stars] createInvoiceLink failed:', err);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    const data = await res.json() as { ok: boolean; result: string };
    return NextResponse.json({ invoiceUrl: data.result });
  } catch (err) {
    console.error('POST /api/billing/stars error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
