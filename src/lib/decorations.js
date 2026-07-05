// Pip's wardrobe. Items unlock with badges (pure celebration — never lost).
// Her choices are stored in the database (settings key 'pip_style') so they
// travel with backups.

export const DECOR_SLOTS = [
  { slot: 'hat', label: 'Hats' },
  { slot: 'friend', label: 'Friends' },
];

export const DECORATIONS = [
  { id: 'bow', emoji: '🎀', slot: 'hat', name: 'Pretty bow', badge: 'storyteller' },
  { id: 'cap', emoji: '🧢', slot: 'hat', name: 'Sporty cap', badge: 'first-sprout' },
  { id: 'tophat', emoji: '🎩', slot: 'hat', name: 'Fancy top hat', badge: 'week-wonder' },
  { id: 'crown', emoji: '👑', slot: 'hat', name: 'Golden crown', badge: 'century-club' },
  { id: 'grad', emoji: '🎓', slot: 'hat', name: 'Scholar cap', badge: 'quiz-master' },
  { id: 'shades', emoji: '🕶️', slot: 'friend', name: 'Cool shades', badge: 'on-a-roll' },
  { id: 'ladybug', emoji: '🐞', slot: 'friend', name: 'Ladybug buddy', badge: 'bookworm' },
  { id: 'butterfly', emoji: '🦋', slot: 'friend', name: 'Butterfly friend', badge: 'full-bloom' },
  { id: 'rainbow', emoji: '🌈', slot: 'friend', name: 'Little rainbow', badge: 'mood-artist' },
  { id: 'star', emoji: '⭐', slot: 'friend', name: 'Lucky star', badge: 'quiz-whiz' },
  { id: 'duck', emoji: '🐤', slot: 'friend', name: 'Duckling pal', badge: 'every-day-hero' },
];

export function parsePipStyle(settings) {
  try {
    return JSON.parse(settings?.pip_style || '{}') || {};
  } catch {
    return {};
  }
}
