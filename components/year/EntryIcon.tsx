/**
 * A small picture for every entry of the beekeeper's year.
 *
 * Not one icon per category — per *task*. "Varroa" covers hanging in a drone frame, cutting the
 * sealed brood out of it, a summer treatment and a winter one; four different jobs that a single
 * mite glyph would flatten into "varroa, somehow". The point of a picture here is to say what to
 * do without reading, so a frame with wide cells, a cut, a mite and a dropper bottle are four
 * pictures.
 *
 * Drawn as one 24×24 grid, stroke only, inheriting `currentColor`, so each one takes the colour
 * of the category it sits in and needs no second version for dark mode. Nothing animates: these
 * carry information, and information that moves is harder to read, not easier.
 */
import type React from 'react';

/** The drawing of each icon, on a 24×24 grid. */
const SHAPES: Record<string, React.ReactElement> = {
  // A cluster of bees sitting still through the winter.
  cluster: (
    <>
      <path d="M4 7h16v12H4z" />
      <circle cx="12" cy="13" r="4" />
      <path d="M9.5 11.2h5M9.2 13h5.6M9.5 14.8h5" />
      <path d="M4 7l8-3 8 3" />
    </>
  ),
  // A block of fondant laid over the frames.
  candy: (
    <>
      <path d="M4 9h16v10H4z" />
      <path d="M8 19V9M12 19V9M16 19V9" />
      <rect x="8.5" y="4.5" width="7" height="4" rx="1" />
    </>
  ),
  // The first flight out on a mild day.
  flight: (
    <>
      <circle cx="17.5" cy="6.5" r="3" />
      <path d="M17.5 1.6v1.4M17.5 10v1.4M22.4 6.5H21M14 6.5h-1.4" />
      <path d="M3 20h8" />
      <ellipse cx="8" cy="14" rx="3" ry="2.2" />
      <path d="M6.6 12.2 4.4 10M9.4 12.2l2.2-2.2" />
    </>
  ),
  // A frame held up and looked at.
  magnifier: (
    <>
      <path d="M4 3h10v14H4z" />
      <path d="M4 6.5h10M4 10h10M4 13.5h10" />
      <circle cx="15.5" cy="15.5" r="4.5" />
      <path d="M18.8 18.8 22 22" />
    </>
  ),
  // Sunken, perforated cappings: what foulbrood looks like in the comb.
  broodWarning: (
    <>
      <path d="M3 6h12v12H3z" />
      <circle cx="6.5" cy="9.5" r="1.4" />
      <circle cx="11.5" cy="9.5" r="1.4" />
      <circle cx="6.5" cy="14.5" r="1.4" />
      <circle cx="11.5" cy="14.5" r="1.4" />
      <path d="M19 7v6M19 16.5v.6" />
    </>
  ),
  // A sample on its way to the laboratory.
  lab: (
    <>
      <path d="M10 2.5v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9.5v-6" />
      <path d="M8.5 2.5h7" />
      <path d="M7 14h10" />
    </>
  ),
  // Forage in flower.
  blossom: (
    <>
      <circle cx="12" cy="9" r="2.2" />
      <path d="M12 2.5a3 3 0 0 1 0 4.3M12 15.5a3 3 0 0 0 0-4.3M5.4 5.6a3 3 0 0 1 4 1.5M18.6 12.4a3 3 0 0 0-4-1.5M5.4 12.4a3 3 0 0 0 4-1.5M18.6 5.6a3 3 0 0 1-4 1.5" />
      <path d="M12 15.5V22" />
    </>
  ),
  // Fresh foundation going in beside the brood nest.
  comb: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="m9 8 2.5-1.4L14 8v2.8l-2.5 1.4L9 10.8z" />
      <path d="m14 13 2.5-1.4L19 13v2.8l-2.5 1.4L14 15.8z" />
      <path d="m5 13 2.5-1.4L10 13v2.8l-2.5 1.4L5 15.8z" />
    </>
  ),
  // A frame of wide drone cells, hung at the edge to collect mites.
  droneFrame: (
    <>
      <path d="M4 3h16v18H4z" />
      <path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z" />
    </>
  ),
  // That frame, cut out once the brood is sealed.
  cut: (
    <>
      <path d="M4 3h9v18H4z" />
      <path d="M4 9h9M4 15h9" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M16.6 7.4 10 16M16.6 16.6 10 8" />
    </>
  ),
  // A super going on top.
  super: (
    <>
      <path d="M3 13h18v8H3z" />
      <path d="M3 13l9-3 9 3" />
      <path d="M12 8V2M12 2 9.5 4.5M12 2l2.5 2.5" />
    </>
  ),
  // The peanut-shaped cell that means the old queen is about to leave.
  queenCell: (
    <>
      <path d="M5 3h14v8H5z" />
      <path d="M9 3v8M14 3v8" />
      <path d="M12 11c2.2 0 3.4 2 3.4 4.6S14 21 12 21s-3.4-2.8-3.4-5.4S9.8 11 12 11z" />
      <path d="M10.6 15.6h2.8" />
    </>
  ),
  // A new queen.
  queen: (
    <>
      <ellipse cx="12" cy="15" rx="3.4" ry="5" />
      <path d="M9.4 13h5.2M9.2 16h5.6M10 19h4" />
      <path d="M7 8.5 9 4l3 3 3-3 2 4.5z" />
    </>
  ),
  // Hives on a lorry, which is what migratory beekeeping actually looks like.
  truck: (
    <>
      <path d="M2 16V7h10v9" />
      <path d="M12 10h4.5l3.5 3.5V16" />
      <circle cx="6.5" cy="18.5" r="2" />
      <circle cx="17" cy="18.5" r="2" />
      <path d="M8.5 18.5H15M2 16h2.5M19 16h3" />
      <path d="M4 7V5h6v2" />
    </>
  ),
  // The extractor the honey is spun out in.
  extractor: (
    <>
      <path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M4 7h16" />
      <path d="M12 7V3M9.5 3h5" />
      <path d="M9 11v6M15 11v6" />
      <path d="M9 21v1M15 21v1" />
    </>
  ),
  // Heather honey will not spin; it is pressed.
  press: (
    <>
      <path d="M4 3h16" />
      <path d="M12 3v4" />
      <path d="M6 7h12v4H6z" />
      <path d="M8 11v3M16 11v3" />
      <path d="M5 14h14l-1.5 7h-11z" />
      <path d="M12 14v7" />
    </>
  ),
  // A varroa mite.
  mite: (
    <>
      <ellipse cx="12" cy="12" rx="6" ry="4.6" />
      <path d="M6.4 9 3 6.5M6.2 12H2.6M6.6 15 3.4 17.6M17.6 9 21 6.5M17.8 12h3.6M17.4 15l3.2 2.6" />
      <path d="M10 10.6h4" />
    </>
  ),
  // Oxalic acid, dribbled between the seams.
  drop: (
    <>
      <path d="M8 2.5h5l-.6 4.5h-3.8z" />
      <path d="M9.2 7h3.6l1.6 9a2.6 2.6 0 0 1-2.6 3h-1.6a2.6 2.6 0 0 1-2.6-3z" />
      <path d="M19 13c1.2 1.6 1.8 2.7 1.8 3.5a1.8 1.8 0 0 1-3.6 0c0-.8.6-1.9 1.8-3.5z" />
    </>
  ),
  // The feeder that goes on for the winter stores.
  feeder: (
    <>
      <path d="M5 8h14l-1.6 11.4a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.6z" />
      <path d="M4 8h16" />
      <path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V8" />
      <path d="M9 13h6M9.6 16.5h4.8" />
    </>
  ),
  // Wasps at the entrance, and an entrance made small.
  wasp: (
    <>
      <path d="M3 17h18v4H3z" />
      <path d="M9.5 17v4M14.5 17v4" />
      <ellipse cx="12" cy="8" rx="3" ry="4.2" />
      <path d="M9.4 7h5.2M9.2 9.6h5.6" />
      <path d="M9.6 4.4 6.4 2.2M14.4 4.4l3.2-2.2" />
    </>
  ),
  // A mouse guard across the entrance for the winter.
  mouseGuard: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 5l8-3 8 3" />
      <path d="M6 15h12v4H6z" />
      <path d="M8.4 15v4M10.8 15v4M13.2 15v4M15.6 15v4" />
    </>
  ),
  // Wax melted down, frames wired, equipment mended.
  tools: (
    <>
      <path d="M3 20.5 10 13.5" />
      <path d="M8.6 11.9 6 9.3l1.8-1.8a3.4 3.4 0 0 0 4-4L14 5.3l-2.6 2.6" />
      <path d="M15 4.4 19.6 9l1.4-1.4a3.3 3.3 0 0 0-4.6-4.6z" />
      <path d="M13 12.5 20.5 20" />
    </>
  ),
};

/** Which picture each entry gets. Everything not listed falls back to its category. */
const BY_ENTRY: Record<string, string> = {
  'winter-rest': 'cluster',
  'candy-feeding': 'candy',
  'cleansing-flight': 'flight',
  'first-inspection': 'magnifier',
  'winter-check': 'magnifier',
  'foulbrood-check': 'broodWarning',
  'foulbrood-sample': 'lab',
  'spring-bloom': 'blossom',
  'ivy-bloom': 'blossom',
  'comb-renewal': 'comb',
  'drone-frame-insert': 'droneFrame',
  'drone-brood-cutting': 'cut',
  'honey-super': 'super',
  'swarm-control': 'queenCell',
  'replace-queens': 'queen',
  'harvest-heather': 'press',
  'varroa-summer': 'mite',
  'oxalic-acid': 'drop',
  'winter-feeding': 'feeder',
  'robbing-wasps': 'wasp',
  'winter-prep': 'mouseGuard',
  'winter-work': 'tools',
};

/** Every migration is a lorry, every other harvest is the extractor. */
const BY_CATEGORY: Record<string, string> = {
  migration: 'truck',
  harvest: 'extractor',
  varroa: 'mite',
  swarm: 'queenCell',
  bloom: 'blossom',
  feeding: 'feeder',
  inspection: 'magnifier',
  winter: 'cluster',
  care: 'tools',
};

export function iconNameFor(key: string, category: string): string {
  return BY_ENTRY[key] ?? BY_CATEGORY[category] ?? 'tools';
}

/** The icon for one entry. Decorative: the title beside it already says what this is. */
export default function EntryIcon(
  { entryKey, category, className }: { entryKey: string; category: string; className?: string },
) {
  const shape = SHAPES[iconNameFor(entryKey, category)];
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}
