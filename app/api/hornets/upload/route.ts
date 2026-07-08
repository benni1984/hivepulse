import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const EXT_BY_TYPE: Record<(typeof ALLOWED_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * `file.type` is the browser/client-supplied Content-Type — trivially spoofed
 * (e.g. an .svg or .html file relabelled as image/png). Since the resulting
 * blob is served back publicly and linked from <img src>, an attacker could
 * otherwise get an SVG-with-embedded-script or HTML file served as "an
 * image", opening a stored-XSS path. Sniff the actual file signature instead
 * of trusting the declared type.
 */
function sniffImageType(bytes: Uint8Array): (typeof ALLOWED_TYPES)[number] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // "RIFF"
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50   // "WEBP"
  ) {
    return 'image/webp';
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG and WebP images are allowed' },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File must be smaller than 10 MB' }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed || sniffed !== file.type) {
      return NextResponse.json(
        { error: 'File content does not match a supported image format' },
        { status: 400 },
      );
    }

    // Ignore the client-supplied filename entirely — it's untrusted input and
    // gives no benefit over a name derived from the (now-verified) file type.
    const key = `hornets/${Date.now()}-${randomUUID()}.${EXT_BY_TYPE[sniffed]}`;
    const blob = await put(key, new Blob([buffer], { type: sniffed }), {
      access: 'public',
      contentType: sniffed,
    });

    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
