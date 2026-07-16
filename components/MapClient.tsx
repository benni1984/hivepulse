'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Apiary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hive_count: number;
}
interface StatsData {
  apiary_count: number;
  hive_count: number;
  inspection_count: number;
  apiaries: Apiary[];
}
interface HeatmapData {
  type: string;
  features: {
    type: string;
    geometry: { type: string; coordinates: number[][][] };
    properties: { avg_varroa: number; apiary_count: number; inspection_count: number };
  }[];
}

// Highest varroa_count the app's inspection form accepts -- used to normalize
// heat-layer intensity so the green->amber->red gradient lines up with the
// same Low(<2)/Medium(2-5)/High(>5) thresholds shown in the legend.
const VARROA_SCALE_MAX = 12;

const GRADIENT_STOPS: [number, [number, number, number]][] = [
  [0, [0x22, 0xc5, 0x5e]],   // #22c55e green
  [0.5, [0xf5, 0x9e, 0x0b]], // #f59e0b amber
  [1, [0xef, 0x44, 0x44]],   // #ef4444 red
];

// Linear interpolation across GRADIENT_STOPS for a 0-1 intensity value.
export function gradientColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(t, 1));
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const [t0, c0] = GRADIENT_STOPS[i];
    const [t1, c1] = GRADIENT_STOPS[i + 1];
    if (clamped <= t1) {
      const localT = (clamped - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * localT),
        Math.round(c0[1] + (c1[1] - c0[1]) * localT),
        Math.round(c0[2] + (c1[2] - c0[2]) * localT),
      ];
    }
  }
  return GRADIENT_STOPS[GRADIENT_STOPS.length - 1][1];
}

// leaflet.heat (the obvious off-the-shelf choice) turned out to be
// unusable here: it's a 2014-era plugin with no module system at all --
// it just assumes a global `L` is already sitting in scope by the time it
// runs. Under Turbopack's ESM dynamic imports that global either doesn't
// exist or isn't the same Leaflet instance this component holds, so the
// layer silently never renders (no thrown error -- it just never becomes a
// real Leaflet layer the map recognizes). Confirmed live: the control
// checkbox toggled fine, but zero <canvas> element ever appeared.
// A hand-rolled L.Layer avoids the whole problem, since it's built from
// the exact same `L` this component already imported -- and the radial
// gradient per point gives a genuinely soft, blurred blob rather than
// leaflet.heat's density-summed canvas anyway, which is closer to what
// "natural-looking gradient, not a flat square" actually asked for.
function createHeatCanvasLayer(
  L: typeof import('leaflet'),
  points: [number, number, number][],
  options: { radius: number; max: number; minOpacity: number }
) {
  const HeatCanvasLayer = L.Layer.extend({
    onAdd(this: any, map: L.Map) {
      this._map = map;
      this._canvas = L.DomUtil.create('canvas', 'map-heatmap-canvas leaflet-zoom-hide');
      const size = map.getSize();
      this._canvas.width = size.x;
      this._canvas.height = size.y;
      map.getPanes().overlayPane.appendChild(this._canvas);
      map.on('moveend zoomend resize', this._redraw, this);
      this._redraw();
    },
    onRemove(this: any, map: L.Map) {
      map.getPanes().overlayPane.removeChild(this._canvas);
      map.off('moveend zoomend resize', this._redraw, this);
    },
    _redraw(this: any) {
      const map = this._map;
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this._canvas, topLeft);
      const size = map.getSize();
      if (this._canvas.width !== size.x) this._canvas.width = size.x;
      if (this._canvas.height !== size.y) this._canvas.height = size.y;
      const ctx = this._canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      points.forEach(([lat, lng, value]) => {
        const p = map.latLngToContainerPoint([lat, lng]);
        const intensity = Math.max(0, Math.min(value / options.max, 1));
        const [r, g, b] = gradientColor(intensity);
        const opacity = Math.max(options.minOpacity, intensity);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, options.radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, options.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  });
  return new HeatCanvasLayer();
}

function polygonCentroid(coords: number[][]): [number, number] {
  // GeoJSON rings repeat the first point as the last to close the loop --
  // compare by value (not reference) to drop that duplicate, otherwise it's
  // overweighted in the average. Grid cells are simple rectangles, so a
  // plain average of the (unique) ring points is a good enough sample point
  // for the heat layer -- no need for a true area-weighted centroid.
  const [firstLng, firstLat] = coords[0];
  const last = coords[coords.length - 1];
  const ring = last[0] === firstLng && last[1] === firstLat ? coords.slice(0, -1) : coords;
  const lng = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
  const lat = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
  return [lat, lng];
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Labels {
  apiaries: string;
  hives: string;
  inspections: string;
  hiveSingular: string;
  hivePlural: string;
  viewDetails: string;
  heatmapToggle: string;
  heatmapLow: string;
  heatmapMedium: string;
  heatmapHigh: string;
}

export default function MapClient({ labels }: { labels: Labels }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ apiaries: '—', hives: '—', inspections: '—' });
  const [hasHeatmap, setHasHeatmap] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    let destroyed = false;
    import('leaflet').then(L => {
      if (destroyed || !mapRef.current) return;

      const map = L.default.map(mapRef.current).setView([48, 10], 4);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const hiveIcon = L.default.divIcon({
        className: '',
        html: `<div style="background:#14532d;border:3px solid #f59e0b;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;">🐝</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      Promise.all([
        fetch('/api/v1/public/stats').then(r => r.json()),
        fetch('/api/v1/public/heatmap').then(r => r.json()),
      ]).then(([data, heatmap]: [StatsData, HeatmapData]) => {
        if (destroyed) return;

        setStats({
          apiaries: data.apiary_count.toLocaleString(),
          hives: data.hive_count.toLocaleString(),
          inspections: data.inspection_count.toLocaleString(),
        });

        if (data.apiaries?.length) {
          const bounds: [number, number][] = [];
          data.apiaries.forEach(a => {
            bounds.push([a.latitude, a.longitude]);
            const marker = L.default.marker([a.latitude, a.longitude], { icon: hiveIcon }).addTo(map);
            marker.bindPopup(
              `<div class="map-popup"><h3>${esc(a.name)}</h3><p>🐝 ${a.hive_count} ${a.hive_count !== 1 ? labels.hivePlural : labels.hiveSingular}</p><a href="/apiary?id=${a.id}">${labels.viewDetails}</a></div>`,
              { maxWidth: 220 }
            );
          });
          if (bounds.length === 1) map.setView(bounds[0], 12);
          else map.fitBounds(bounds, { padding: [40, 40] });
        }

        if (heatmap.features?.length) {
          const centroids = heatmap.features.map(f => polygonCentroid(f.geometry.coordinates[0]));

          // A soft, continuous gradient (screen-pixel radius, not tied to the
          // cells' geographic size) reads far more like a natural heatmap
          // than the old flat-colored grid squares -- and stays visible at
          // any zoom level instead of shrinking to a few pixels when zoomed
          // out.
          const heatPoints: [number, number, number][] = heatmap.features.map((f, i) => [
            centroids[i][0], centroids[i][1], f.properties.avg_varroa,
          ]);
          const heatLayer = createHeatCanvasLayer(L.default, heatPoints, {
            radius: 60,
            max: VARROA_SCALE_MAX,
            minOpacity: 0.35,
          });

          // The heat layer is a canvas overlay with no per-point
          // interactivity, so pair it with small, fully transparent circle
          // markers purely as click targets -- keeps the same popup info the
          // old grid-square layer had.
          const popupMarkers = heatmap.features.map((f, i) => {
            const p = f.properties;
            return L.default.circleMarker(centroids[i], { radius: 24, opacity: 0, fillOpacity: 0 }).bindPopup(
              `<div class="map-popup"><h3>🪲 Varroa: ${p.avg_varroa}</h3><p>${p.apiary_count} apiar${p.apiary_count !== 1 ? 'ies' : 'y'} · ${p.inspection_count} inspection${p.inspection_count !== 1 ? 's' : ''}</p></div>`,
              { maxWidth: 200 }
            );
          });
          const heatmapLayer = L.default.layerGroup([heatLayer, ...popupMarkers]);

          L.default.control.layers(
            {},
            { [labels.heatmapToggle]: heatmapLayer },
            { collapsed: false, position: 'topright' }
          ).addTo(map);

          // Legend control
          const legend = new L.default.Control({ position: 'bottomleft' });
          legend.onAdd = () => {
            const div = L.default.DomUtil.create('div', 'map-heatmap-legend');
            div.innerHTML =
              `<div class="legend-row"><span class="legend-dot" style="background:#22c55e"></span>${labels.heatmapLow}</div>` +
              `<div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span>${labels.heatmapMedium}</div>` +
              `<div class="legend-row"><span class="legend-dot" style="background:#ef4444"></span>${labels.heatmapHigh}</div>`;
            return div;
          };
          legend.addTo(map);

          setHasHeatmap(true);
        }
      }).catch(() => {});

      return () => { destroyed = true; map.remove(); };
    });

    return () => { destroyed = true; };
  }, []);

  return (
    <>
      <div className="map-stats-bar">
        <div className="map-stat-pill"><span className="num">{stats.apiaries}</span><span className="label">{labels.apiaries}</span></div>
        <div className="map-stat-pill"><span className="num">{stats.hives}</span><span className="label">{labels.hives}</span></div>
        <div className="map-stat-pill"><span className="num">{stats.inspections}</span><span className="label">{labels.inspections}</span></div>
      </div>
      <div id="map" ref={mapRef} />
    </>
  );
}
