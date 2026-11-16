import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TOURS, pick, tourById } from '@/lib/tours';

/**
 * Every step of every tour points at a control that exists.
 *
 * `data-tour` is the whole coupling between a tour and the interface (#449), and it is the first
 * thing that will rot: somebody renames a component, moves a button into a menu, replaces a
 * `<button>` with a `<Link>`, and a step now points at nothing. The engine degrades honestly when
 * that happens — it says the control is not on this screen and offers to leave — but an honest
 * dead end is still a dead end, and nobody would find out until a beekeeper did.
 *
 * So the anchors are pinned here, the same way `backend/tests/test_date_picker_bounds.py` pins
 * the date bounds across both phones.
 */
const LOCALES = ['en', 'de', 'fr', 'es', 'pl'] as const;
const ROOTS = ['app', 'components'];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

const sources = ROOTS.flatMap(r => sourceFiles(join(process.cwd(), r)))
  .map(f => readFileSync(f, 'utf8'));

function anchorExists(anchor: string): boolean {
  return sources.some(src => src.includes(`data-tour="${anchor}"`));
}

describe('guided tours', () => {
  it('has tours to check', () => {
    // A fixture check: an empty TOURS would make every assertion below pass.
    expect(TOURS.length).toBeGreaterThan(0);
    expect(TOURS.flatMap(t => t.steps).length).toBeGreaterThan(3);
    expect(sources.length).toBeGreaterThan(20);
  });

  it('points every step at a control that exists', () => {
    const missing: string[] = [];
    for (const tour of TOURS) {
      for (const [i, step] of tour.steps.entries()) {
        if (!anchorExists(step.anchor)) {
          missing.push(`${tour.id} step ${i + 1}: no element carries data-tour="${step.anchor}"`);
        }
      }
    }
    expect(missing, missing.join('\n  ')).toEqual([]);
  });

  it('has an id that is unique, because the engine looks them up by it', () => {
    const ids = TOURS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(tourById(id)?.id).toBe(id);
  });

  it('says every word in all five languages', () => {
    const gaps: string[] = [];
    for (const tour of TOURS) {
      for (const field of ['title', 'summary'] as const) {
        for (const locale of LOCALES) {
          if (!tour[field][locale]?.trim()) gaps.push(`${tour.id}.${field} has no ${locale}`);
        }
      }
      for (const [i, step] of tour.steps.entries()) {
        for (const locale of LOCALES) {
          if (!step.text[locale]?.trim()) gaps.push(`${tour.id} step ${i + 1} has no ${locale}`);
        }
      }
    }
    expect(gaps, gaps.join('\n  ')).toEqual([]);
  });

  it('is mostly made of real clicks, not of a "next" button', () => {
    // The whole point is to point at a control and wait. A tour of nothing but `manual` steps is
    // the carousel we are replacing, wearing an overlay.
    for (const tour of TOURS) {
      const manual = tour.steps.filter(s => s.advance === 'manual').length;
      const real = tour.steps.length - manual;
      if (tour.steps.length > 1) {
        expect(real, `${tour.id} is ${manual}/${tour.steps.length} "next" steps`).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to English for a language nobody wrote', () => {
    expect(pick(TOURS[0].title, 'it')).toBe(TOURS[0].title.en);
    expect(pick(TOURS[0].title, 'de')).toBe(TOURS[0].title.de);
  });

  it('is reachable again afterwards, which the old carousel was not', () => {
    // Every tour must be startable from somewhere, or it is a first-run wizard with extra steps.
    // TourHint renders nothing for an unknown id, so a hint for a deleted tour is a dead "?" —
    // this is the half of that check that lives on the tours' side.
    const hinted = sources
      .flatMap(src => [...src.matchAll(/<TourHint\s+tour="([^"]+)"/g)].map(m => m[1]));
    const unknown = hinted.filter(id => !tourById(id));
    expect(unknown, `TourHint points at tours that do not exist: ${unknown.join(', ')}`).toEqual([]);
  });

  it('keeps the engine out of the step definitions', () => {
    // A step may not carry markup or a selector: the anchor is the contract, and a tour that
    // reaches into the DOM itself is a tour that breaks silently.
    for (const tour of TOURS) {
      for (const step of tour.steps) {
        expect(step.anchor).toMatch(/^[a-z][a-z0-9-]*$/);
        for (const locale of LOCALES) {
          expect(step.text[locale]).not.toMatch(/[<>]/);
        }
      }
    }
  });
});
