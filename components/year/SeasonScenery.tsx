/**
 * The scenery behind the year ribbon: four seasons, drawn rather than photographed.
 *
 * Drawn on purpose. A photograph of a hive in snow would be licensed material in a public
 * repository, it would weigh a hundred times this, and it would fight the amber-and-forest palette
 * instead of belonging to it. These are a few hundred bytes of path data each, they stay crisp at
 * any width, and they take their colours from the design tokens, so dark mode needs no second set
 * of pictures.
 *
 * Everything here is decoration: it carries no information the bars and the labels do not already
 * carry, so it is hidden from assistive technology. The motion is small and stops entirely under
 * `prefers-reduced-motion` — a timeline somebody reads while standing at a hive should not shimmer.
 */

import type React from 'react';

type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/** Which season a month belongs to, as a beekeeper would divide the year. */
export function seasonOfMonth(month: number): Season {
  if (month <= 2 || month === 12) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

/** Deterministic jitter, so the scenery is varied but identical on the server and the client. */
function scatter(seed: number, count: number): number[] {
  const values: number[] = [];
  let state = seed * 9301 + 49297;
  for (let index = 0; index < count; index += 1) {
    state = (state * 9301 + 49297) % 233280;
    values.push(state / 233280);
  }
  return values;
}

function Hive({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className="dash-year-hive">
      <rect x="-9" y="-16" width="18" height="6" rx="1.5" />
      <rect x="-9" y="-9" width="18" height="6" rx="1.5" />
      <rect x="-9" y="-2" width="18" height="6" rx="1.5" />
      <path d="M-11 -16 L0 -23 L11 -16 Z" />
      <rect x="-2.5" y="1.5" width="5" height="2.5" rx="1" className="dash-year-hive-door" />
    </g>
  );
}

/** A bee: two wings and a striped body, at the size where that is all it can be. */
function Bee({ x, y, delay, duration }: { x: number; y: number; delay: number; duration: number }) {
  return (
    <g
      className="dash-year-bee"
      style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
      transform={`translate(${x} ${y})`}
    >
      <ellipse className="dash-year-bee-wing" cx="-0.6" cy="-2" rx="2.4" ry="1.3" />
      <ellipse className="dash-year-bee-wing dash-year-bee-wing-far" cx="1" cy="-2.2" rx="2.1" ry="1.1" />
      <ellipse className="dash-year-bee-body" cx="0" cy="0" rx="3" ry="2" />
      <rect className="dash-year-bee-stripe" x="-0.8" y="-2" width="1.1" height="4" rx="0.5" />
      <rect className="dash-year-bee-stripe" x="1.2" y="-1.7" width="1.1" height="3.4" rx="0.5" />
    </g>
  );
}

function WinterPanel({ seed }: { seed: number }) {
  const flakes = scatter(seed, 14);
  return (
    <g>
      {/* Bare branches: winter is the one season with nothing in bloom, and it should look it. */}
      <path className="dash-year-branch" d="M14 96 C 20 70, 14 56, 24 40 M24 40 C 30 46, 38 44, 42 36 M24 52 C 16 56, 10 52, 6 44" />
      <path className="dash-year-branch" d="M250 96 C 244 76, 252 62, 244 46 M244 46 C 238 52, 230 50, 226 42" />
      <Hive x={150} y={94} scale={1.05} />
      {/* Snow on the hive roof and the ground line. */}
      <path className="dash-year-snow-cap" d="M136 78 Q150 70 164 78 Q150 74 136 78 Z" />
      {flakes.map((value, index) => (
        <circle
          key={index}
          className="dash-year-flake"
          cx={10 + value * 250}
          cy={-6}
          r={1 + (index % 3) * 0.45}
          style={{ animationDelay: `${(index % 7) * 1.1}s`, animationDuration: `${9 + (index % 5) * 2}s` }}
        />
      ))}
    </g>
  );
}

function SpringPanel({ seed }: { seed: number }) {
  const petals = scatter(seed, 10);
  return (
    <g>
      {/* A blossoming branch: the thing the whole beekeeping year waits for. */}
      <path className="dash-year-branch" d="M8 96 C 16 72, 8 58, 20 38 M20 38 C 28 44, 38 40, 46 30" />
      {[[20, 38], [33, 42], [46, 30], [14, 56], [26, 24]].map(([x, y], index) => (
        <g key={index} className="dash-year-blossom" style={{ animationDelay: `${index * 0.35}s` }}>
          {[0, 72, 144, 216, 288].map(angle => (
            <ellipse
              key={angle}
              cx={x}
              cy={y}
              rx="2.6"
              ry="1.4"
              transform={`rotate(${angle} ${x} ${y}) translate(2.4 0)`}
            />
          ))}
          <circle cx={x} cy={y} r="1.1" className="dash-year-blossom-heart" />
        </g>
      ))}
      <Hive x={152} y={94} />
      <Hive x={182} y={96} scale={0.82} />
      {/* Dandelions: the first real forage, and the reason the colonies explode in April. */}
      {[108, 124, 206, 228, 244].map((x, index) => (
        <g key={x} className="dash-year-flower" style={{ animationDelay: `${index * 0.6}s` }}>
          <path className="dash-year-stem" d={`M${x} 96 C ${x - 2} 88, ${x + 2} 84, ${x} 80`} />
          <circle cx={x} cy={79} r="2.6" className="dash-year-flower-head" />
        </g>
      ))}
      {petals.map((value, index) => (
        <ellipse
          key={index}
          className="dash-year-petal"
          cx={6 + value * 120}
          cy={-4}
          rx="1.8"
          ry="1"
          style={{ animationDelay: `${(index % 5) * 1.6}s`, animationDuration: `${8 + (index % 4) * 2.5}s` }}
        />
      ))}
      <Bee x={74} y={56} delay={0} duration={14} />
      <Bee x={128} y={44} delay={3.5} duration={17} />
    </g>
  );
}

function SummerPanel({ seed }: { seed: number }) {
  const grasses = scatter(seed, 18);
  return (
    <g>
      <circle className="dash-year-sun" cx="236" cy="28" r="13" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <line
          key={angle}
          className="dash-year-sunray"
          x1="236"
          y1="28"
          x2="236"
          y2="7"
          transform={`rotate(${angle} 236 28)`}
          style={{ animationDelay: `${angle / 360}s` }}
        />
      ))}
      <Hive x={46} y={94} scale={1.1} />
      <Hive x={76} y={96} scale={0.9} />
      <Hive x={102} y={97} scale={0.78} />
      {/* A meadow. Height varies, so the horizon is not a ruled line. */}
      {grasses.map((value, index) => {
        const x = 8 + index * 14.5;
        const height = 10 + value * 14;
        return (
          <path
            key={index}
            className="dash-year-grass"
            d={`M${x} 97 C ${x + 2} ${97 - height * 0.6}, ${x - 2} ${97 - height * 0.8}, ${x + 1} ${97 - height}`}
            style={{ animationDelay: `${(index % 6) * 0.4}s` }}
          />
        );
      })}
      {[150, 172, 196].map((x, index) => (
        <g key={x} className="dash-year-flower" style={{ animationDelay: `${index * 0.5}s` }}>
          <path className="dash-year-stem" d={`M${x} 96 C ${x - 2} 86, ${x + 2} 80, ${x} 72`} />
          <circle cx={x} cy={70} r="3.2" className="dash-year-flower-head dash-year-flower-summer" />
        </g>
      ))}
      <Bee x={132} y={48} delay={0} duration={12} />
      <Bee x={62} y={34} delay={2} duration={15} />
      <Bee x={188} y={58} delay={5} duration={18} />
    </g>
  );
}

function AutumnPanel({ seed }: { seed: number }) {
  const leaves = scatter(seed, 11);
  return (
    <g>
      {/* Heather: the last forage of the year, and why hives still travel in August. */}
      {Array.from({ length: 16 }, (_, index) => {
        const x = 96 + index * 10;
        return (
          <g key={x} className="dash-year-heather" style={{ animationDelay: `${(index % 5) * 0.45}s` }}>
            <path className="dash-year-stem" d={`M${x} 97 L${x} 80`} />
            {[0, 1, 2, 3].map(step => (
              <circle key={step} cx={x} cy={80 + step * 4.5} r="1.6" className="dash-year-heather-bell" />
            ))}
          </g>
        );
      })}
      <Hive x={40} y={94} />
      <path className="dash-year-branch" d="M252 96 C 246 74, 254 60, 246 42 M246 42 C 240 48, 232 46, 228 38" />
      {leaves.map((value, index) => (
        <path
          key={index}
          className="dash-year-leaf"
          d="M0 0 C 2.6 -2.2, 5.4 -1, 5 1.6 C 2.4 3.6, -0.4 2.4, 0 0 Z"
          transform={`translate(${8 + value * 250} -6)`}
          style={{ animationDelay: `${(index % 6) * 1.4}s`, animationDuration: `${7 + (index % 4) * 2}s` }}
        />
      ))}
      <Bee x={150} y={52} delay={1} duration={16} />
    </g>
  );
}

const PANELS: Record<Season, (props: { seed: number }) => React.ReactElement> = {
  winter: WinterPanel,
  spring: SpringPanel,
  summer: SummerPanel,
  autumn: AutumnPanel,
};

/**
 * One season's scenery, sized to the width of its months on the ribbon.
 *
 * The viewBox is a fixed 260×100 whatever the real width, so a season that happens to be narrow on
 * a phone shows the same drawing squeezed rather than a cropped one.
 */
export default function SeasonScenery({ season, index }: { season: Season; index: number }) {
  const Panel = PANELS[season];
  return (
    <svg
      className={`dash-year-scene dash-year-scene-${season}`}
      viewBox="0 0 260 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <Panel seed={index + 1} />
      {/* The ground, last, so the stems and the hives stand on it rather than float. */}
      <path className="dash-year-ground" d="M0 97 L260 97" />
    </svg>
  );
}
