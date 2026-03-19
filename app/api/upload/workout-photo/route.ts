import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { authenticateRequest } from '@/lib/auth/helpers';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  console.log('BLOB_READ_WRITE_TOKEN set:', !!process.env.BLOB_READ_WRITE_TOKEN);
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Workout photo upload is not configured (BLOB_READ_WRITE_TOKEN)' },
        { status: 503 },
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Expected multipart field "file"' },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image must be 4MB or smaller' },
        { status: 400 },
      );
    }

    const type = file.type || 'application/octet-stream';
    if (!ALLOWED.has(type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, or WebP images are allowed' },
        { status: 400 },
      );
    }

    const ext =
      type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const pathname = `workout-photos/${auth.userId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(pathname, buffer, {
      access: 'public',
      token,
      contentType: type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
