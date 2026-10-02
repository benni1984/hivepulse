import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Play rejects these two files over their dimensions or their colour type, and the rejection
 * arrives after an upload rather than before. Reading the PNG header here is cheaper.
 */
const BRAND = join(process.cwd(), 'public', 'brand');

/** Width, height and colour type from the IHDR chunk — the first 26 bytes of any PNG. */
function pngHeader(path: string) {
  const buffer = readFileSync(path);
  const signature = buffer.subarray(0, 8);
  expect([...signature]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colourType: buffer[25],
  };
}

describe('Play Store graphics', () => {
  it('the app icon is 512x512', () => {
    const path = join(BRAND, 'play-icon-512.png');
    expect(existsSync(path), 'run scripts/make_store_graphics.py').toBe(true);

    const header = pngHeader(path);

    expect([header.width, header.height]).toEqual([512, 512]);
  });

  it('the feature graphic is 1024x500 and carries no alpha channel', () => {
    const path = join(BRAND, 'play-feature-1024x500.png');
    expect(existsSync(path), 'run scripts/make_store_graphics.py').toBe(true);

    const header = pngHeader(path);

    expect([header.width, header.height]).toEqual([1024, 500]);
    // Colour type 2 is truecolour without alpha; 6 would include it, and Play refuses that.
    expect(header.colourType).toBe(2);
  });

  it('both are redrawable from the brand logo', () => {
    // The recipe matters as much as the files: an asset nobody can regenerate goes stale.
    expect(existsSync(join(process.cwd(), 'scripts', 'make_store_graphics.py'))).toBe(true);
    expect(existsSync(join(BRAND, 'hivepulse-logo.svg'))).toBe(true);
  });
});
