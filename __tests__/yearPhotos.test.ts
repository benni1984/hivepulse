import { describe, it, expect } from 'vitest';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { YEAR_PHOTOS, photoFor } from '@/lib/yearPhotos';

// The photographs come from Wikimedia Commons under CC BY, CC BY-SA or CC0. The first two cost
// nothing but do require the author's name, the licence and a way back to the original, and an
// app in a store is exactly the wrong place to be careless about that. These tests are the
// guard: a picture cannot arrive here without its credit, and a credit cannot outlive its file.

const PUBLIC = join(process.cwd(), 'public', 'year');
const THUMBS = join(PUBLIC, 'thumbs');

describe('the beekeeping-year photographs', () => {
  it('has both sizes on disk for every entry it claims a photograph for', () => {
    for (const [key, photo] of Object.entries(YEAR_PHOTOS)) {
      expect(photo.file, key).toBe(`/year/${key}.webp`);
      expect(photo.thumb, key).toBe(`/year/thumbs/${key}.webp`);
      expect(existsSync(join(PUBLIC, `${key}.webp`)), `${key} is missing its photograph`).toBe(true);
      expect(existsSync(join(THUMBS, `${key}.webp`)), `${key} is missing its tile`).toBe(true);
    }
  });

  it('carries no file that nothing refers to', () => {
    // An orphan is a picture shipped to every visitor that no page ever shows.
    const claimed = Object.keys(YEAR_PHOTOS).map(key => `${key}.webp`).sort();
    const photos = readdirSync(PUBLIC).filter(name => name.endsWith('.webp')).sort();
    const tiles = readdirSync(THUMBS).filter(name => name.endsWith('.webp')).sort();
    expect(photos).toEqual(claimed);
    expect(tiles).toEqual(claimed);
  });

  it('credits an author and a licence for every one of them', () => {
    for (const [key, photo] of Object.entries(YEAR_PHOTOS)) {
      expect(photo.author.trim(), `${key} has no author`).not.toBe('');
      expect(photo.author, `${key} has an unknown author`).not.toBe('unknown');
      expect(photo.licence.trim(), `${key} has no licence`).not.toBe('');
      expect(photo.source, `${key} does not say where it came from`)
        .toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it('uses only licences that allow a paid app to carry the picture', () => {
    // No non-commercial and no no-derivatives: both would make the app itself a breach.
    for (const [key, photo] of Object.entries(YEAR_PHOTOS)) {
      expect(photo.licence, `${key}: ${photo.licence}`)
        .toMatch(/^(CC0|CC BY(-SA)? [0-9.]+( [a-z]{2})?|Public domain)/i);
      expect(photo.licence.toUpperCase(), key).not.toContain('NC');
      expect(photo.licence.toUpperCase(), key).not.toContain('ND');
    }
  });

  it('keeps every picture small enough to send on a hover', () => {
    // The tooltip fetches one the first time a bar is pointed at; a heavy file would show as
    // an empty box for as long as it takes.
    for (const key of Object.keys(YEAR_PHOTOS)) {
      const bytes = statSync(join(PUBLIC, `${key}.webp`)).size;
      expect(bytes, `${key} is ${Math.round(bytes / 1024)} KB`).toBeLessThan(140 * 1024);
    }
  });

  it('keeps the whole set of tiles light enough for a phone to load at once', () => {
    // The list shows every tile there is, so this number is what a beekeeper on mobile data
    // pays to open the year. The photographs together are more than ten times as much, which
    // is the entire reason the tiles exist.
    const total = Object.keys(YEAR_PHOTOS)
      .reduce((sum, key) => sum + statSync(join(THUMBS, `${key}.webp`)).size, 0);
    expect(Math.round(total / 1024), 'KB of tiles').toBeLessThan(250);
  });

  it('answers with nothing for a job that has no photograph, rather than throwing', () => {
    // Five jobs have no picture on Commons worth showing, and every layout leaves them out.
    expect(photoFor('candy-feeding')).toBeUndefined();
    expect(photoFor('not-a-real-entry')).toBeUndefined();
    expect(photoFor('swarm-control')).toBeDefined();
  });
});
