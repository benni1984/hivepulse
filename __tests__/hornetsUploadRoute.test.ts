// @vitest-environment node
//
// This is a server-side route handler (Node.js runtime), not a component —
// jsdom's File/FormData/Request implementations hang when NextRequest reads
// a multipart body constructed this way, so this file opts out of the
// project-wide jsdom environment.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockPut = vi.hoisted(() => vi.fn());

vi.mock('@vercel/blob', () => ({
  put: mockPut,
}));

import { POST } from '@/app/api/hornets/upload/route';

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff, 0xe0];
const WEBP_MAGIC = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

function fileFromBytes(bytes: number[], type: string, name = 'photo.png'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function requestWithFile(file: File | null): NextRequest {
  const form = new FormData();
  if (file) form.set('file', file);
  return new NextRequest('http://localhost/api/hornets/upload', {
    method: 'POST',
    body: form,
  });
}

describe('POST /api/hornets/upload', () => {
  beforeEach(() => {
    mockPut.mockReset();
    mockPut.mockResolvedValue({ url: 'https://blob.example.com/hornets/generated.png' });
  });

  it('rejects when no file is provided', async () => {
    const res = await POST(requestWithFile(null));
    expect(res.status).toBe(400);
  });

  it('rejects a declared type outside the allow-list', async () => {
    const file = fileFromBytes(PNG_MAGIC, 'image/gif');
    const res = await POST(requestWithFile(file));
    expect(res.status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('rejects a file whose content does not match its declared type (spoofed MIME)', async () => {
    // Declares image/png but the actual bytes are an HTML file — the classic
    // "upload an .html/.svg mislabelled as an image" stored-XSS vector.
    const html = new TextEncoder().encode('<html><script>alert(1)</script></html>');
    const file = new File([html], 'photo.png', { type: 'image/png' });
    const res = await POST(requestWithFile(file));
    expect(res.status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit', async () => {
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    big.set(PNG_MAGIC);
    const file = new File([big], 'photo.png', { type: 'image/png' });
    const res = await POST(requestWithFile(file));
    expect(res.status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('accepts a real PNG and uploads with a server-generated filename (ignores client filename)', async () => {
    const file = fileFromBytes(PNG_MAGIC, 'image/png', '../../../etc/passwd.png');
    const res = await POST(requestWithFile(file));
    expect(res.status).toBe(200);
    expect(mockPut).toHaveBeenCalledTimes(1);
    const [key, , opts] = mockPut.mock.calls[0];
    expect(key).toMatch(/^hornets\/\d+-[0-9a-f-]+\.png$/);
    expect(key).not.toContain('etc/passwd');
    expect(opts).toMatchObject({ access: 'public', contentType: 'image/png' });
  });

  it('accepts a real JPEG', async () => {
    const file = fileFromBytes(JPEG_MAGIC, 'image/jpeg');
    const res = await POST(requestWithFile(file));
    expect(res.status).toBe(200);
    expect(mockPut.mock.calls[0][0]).toMatch(/\.jpg$/);
  });

  it('accepts a real WebP', async () => {
    const file = fileFromBytes(WEBP_MAGIC, 'image/webp');
    const res = await POST(requestWithFile(file));
    expect(res.status).toBe(200);
    expect(mockPut.mock.calls[0][0]).toMatch(/\.webp$/);
  });
});
