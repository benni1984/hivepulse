'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Route } from '@/lib/moves';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

interface Props {
  routes: Route[];
  /** The forage as the user should read it: the translated name of a known key, or the text as written. */
  forageLabel: (forage: string) => string;
  /** "Start" for the place a journey began. */
  startLabel: string;
}

/**
 * The journeys of hives: a line per hive through the places it was taken to, numbered in order.
 * Rendering is client-only (Leaflet needs the window), so pages load it with next/dynamic.
 */
export default function MovesMap({ routes, forageLabel, startLabel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Held in refs so a new translation function on every render does not rebuild the whole map.
  const forageLabelRef = useRef(forageLabel);
  forageLabelRef.current = forageLabel;
  const startLabelRef = useRef(startLabel);
  startLabelRef.current = startLabel;

  useEffect(() => {
    if (!mapRef.current) return;
    let destroyed = false;
    let map: import('leaflet').Map | null = null;

    import('leaflet').then(Lmod => {
      const L = Lmod.default ?? Lmod;
      if (destroyed || !mapRef.current) return;

      map = L.map(mapRef.current).setView([48, 10], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const all: [number, number][] = [];
      for (const route of routes) {
        const line = route.points.map(p => [p.lat, p.lng] as [number, number]);
        all.push(...line);
        if (line.length > 1) {
          L.polyline(line, { color: route.color, weight: 3, opacity: 0.8, dashArray: '6 6' }).addTo(map);
        }
        for (const point of route.points) {
          const icon = L.divIcon({
            className: '',
            html: `<div style="background:${route.color};color:#fff;border:2px solid #fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,.35);">${point.order === 0 ? '⌂' : point.order}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -14],
          });
          const lines = [
            `<strong>${esc(point.name)}</strong>`,
            `${esc(route.hiveName)}`,
            point.order === 0 ? esc(startLabelRef.current) : esc(point.date ?? ''),
            point.forage ? esc(forageLabelRef.current(point.forage)) : '',
          ].filter(Boolean);
          L.marker([point.lat, point.lng], { icon }).addTo(map).bindPopup(lines.join('<br/>'));
        }
      }

      if (all.length > 1) map.fitBounds(all, { padding: [30, 30] });
      else if (all.length === 1) map.setView(all[0], 11);
    });

    return () => {
      destroyed = true;
      map?.remove();
    };
  }, [routes]);

  return <div ref={mapRef} data-testid="moves-map" style={{ height: 380, width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />;
}
