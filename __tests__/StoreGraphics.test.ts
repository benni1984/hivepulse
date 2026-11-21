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

  it('all three are redrawable from the brand logo', () => {
    // The recipe matters as much as the files: an asset nobody can regenerate goes stale.
    expect(existsSync(join(process.cwd(), 'scripts', 'make_store_graphics.py'))).toBe(true);
    expect(existsSync(join(BRAND, 'hivepulse-logo.svg'))).toBe(true);
  });
});

/**
 * Paddle shows this one in the checkout and on the invoice, from a URL typed into their
 * console once (#500). Nothing in the application reads the file, so nothing else would ever
 * notice it being renamed, resized or given an alpha channel — the first sign would be a
 * missing picture on somebody's receipt.
 */
describe('the Paddle product icon', () => {
  const path = join(BRAND, 'product-icon-512.png');

  it('is published at the exact path the console points at', () => {
    // https://hivepulse.multihead.de/brand/product-icon-512.png -- public/ is served from the
    // site root, so this file name *is* the URL.
    expect(existsSync(path), 'run scripts/make_store_graphics.py').toBe(true);
  });

  it('is a square 512x512 raster and not an SVG', () => {
    // Checkout and invoice renderers commonly hand back nothing for an SVG, and the brand
    // folder's other logos are all SVGs, so this is the trap to stay out of.
    const header = pngHeader(path);

    expect([header.width, header.height]).toEqual([512, 512]);
  });

  it('carries no alpha channel', () => {
    // Colour type 2 is truecolour without alpha. Transparency on an invoice renders as black
    // about as often as it renders as white.
    expect(pngHeader(path).colourType).toBe(2);
  });

  it('is its own file and not the Play icon under another name', () => {
    // They are the same drawing today and must stay separate files: the next change Google
    // asks for on the listing icon must not silently change what a customer sees on a receipt.
    const script = readFileSync(
      join(process.cwd(), 'scripts', 'make_store_graphics.py'), 'utf8');

    expect(script).toContain('product-icon-512.png');
    expect(script).toContain('play-icon-512.png');
  });
});
