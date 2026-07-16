// leaflet.heat ships no types of its own; @types/leaflet.heat only augments
// the "leaflet" module (adds L.heatLayer) and declares nothing for the
// "leaflet.heat" import path itself. We only ever import it for its side
// effect (dynamic `import('leaflet.heat')`), so an empty ambient module is
// enough to satisfy the resolver.
declare module 'leaflet.heat';
