// colorPalette.js
// Central color palette and color mapping for entity types

export const COLOR_PALETTE = [
  '#4285f4', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#8b5cf6', // purple
  '#ef4444', // red
  '#6366f1', // indigo
  '#f472b6', // pink
  '#f43f5e', // rose
  '#22d3ee', // cyan
  '#a3e635', // lime
  '#eab308', // yellow
  '#a21caf', // violet
  '#f97316', // amber
  '#14b8a6', // teal
  '#e11d48', // crimson
];

export function getEntityTypeColorMap(entityTypes) {
  const map = {};
  entityTypes.forEach((type, i) => {
    map[type] = COLOR_PALETTE[i % COLOR_PALETTE.length];
  });
  return map;
}
