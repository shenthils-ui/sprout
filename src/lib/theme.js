// Theme picker: palettes are device-local (localStorage) so she can style her
// phone without touching the shared database.

export const PALETTES = [
  { id: 'sunny', name: 'Sunny Yellow', emoji: '🌞', swatch: '#f59e0b' },
  { id: 'bubblegum', name: 'Bubblegum Pink', emoji: '🍬', swatch: '#ec4899' },
  { id: 'ocean', name: 'Ocean Teal', emoji: '🌊', swatch: '#0d9488' },
  { id: 'galaxy', name: 'Galaxy Purple', emoji: '🪐', swatch: '#8b5cf6' },
  { id: 'mint', name: 'Mint Green', emoji: '🌿', swatch: '#10b981' },
  { id: 'peach', name: 'Peachy Sunset', emoji: '🍑', swatch: '#f97316' },
];

export function loadTheme() {
  return {
    palette: localStorage.getItem('sprout-palette') || 'sunny',
    mode: localStorage.getItem('sprout-mode') || 'light',
  };
}

export function applyTheme({ palette, mode }) {
  document.documentElement.dataset.palette = palette;
  document.documentElement.dataset.mode = mode;
  localStorage.setItem('sprout-palette', palette);
  localStorage.setItem('sprout-mode', mode);
}
