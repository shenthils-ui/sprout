// Daily rotation helpers: writing prompt + word/fact of the day.
import { dayIndex } from '../../shared/dates.js';
import { WORDS_AND_FACTS } from '../../shared/words.js';

// With 30+ active prompts this never repeats within a month.
export function promptOfTheDay(prompts, dateStr) {
  if (!prompts.length) return null;
  return prompts[dayIndex(dateStr) % prompts.length];
}

export function shufflePrompt(prompts, currentText) {
  const others = prompts.filter((p) => p.text !== currentText);
  if (!others.length) return prompts[0] ?? null;
  return others[Math.floor(Math.random() * others.length)];
}

export function wordOfTheDay(dateStr) {
  return WORDS_AND_FACTS[dayIndex(dateStr) % WORDS_AND_FACTS.length];
}

export const MOODS = ['😄', '🙂', '😌', '🤩', '😴', '😢', '😠', '🤔'];

export function friendlyDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export function shortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}
