// Badge catalog. Badges are pure celebration: once earned, never taken away
// (they live in the earned_badges table; conditions are only checked to ADD).
export const BADGE_CATALOG = [
  { id: 'first-sprout', emoji: '🌱', name: 'First Sprout', desc: 'You finished your very first task. The adventure begins!' },
  { id: 'storyteller', emoji: '✍️', name: 'Storyteller', desc: 'You wrote your first diary entry.' },
  { id: 'week-wonder', emoji: '🗓️', name: 'Week Wonder', desc: 'You used Sprout on 7 different days.' },
  { id: 'on-a-roll', emoji: '🔥', name: 'On a Roll', desc: 'A 7-day streak on any task. Whoosh!' },
  { id: 'bookworm', emoji: '📚', name: 'Bookworm', desc: 'You read 100 pages in total.' },
  { id: 'page-turner', emoji: '📖', name: 'Page Turner', desc: '500 pages read. That is a LOT of story.' },
  { id: 'maestro', emoji: '🎵', name: 'Maestro', desc: '300 minutes of music practice all together.' },
  { id: 'crafty-hands', emoji: '🎨', name: 'Crafty Hands', desc: 'You finished 5 craft projects.' },
  { id: 'deep-thoughts', emoji: '📔', name: 'Deep Thoughts', desc: 'You wrote 10 diary entries.' },
  { id: 'mood-artist', emoji: '🌈', name: 'Mood Artist', desc: 'You tagged your mood 5 times.' },
  { id: 'century-club', emoji: '💯', name: 'Century Club', desc: '100 tasks done, all-time. Amazing!' },
  { id: 'full-bloom', emoji: '🌻', name: 'Full Bloom', desc: 'Your companion reached full bloom!' },
  { id: 'first-book', emoji: '📕', name: 'The End!', desc: 'You finished your first book with a reading goal!' },
  { id: 'book-collector', emoji: '📗', name: 'Book Collector', desc: 'Five whole books finished. A real reader!' },
  { id: 'mega-bookworm', emoji: '🏆', name: 'Mega Bookworm', desc: '1,000 pages read. One THOUSAND!' },
  { id: 'novelist', emoji: '📝', name: 'Novelist', desc: '30 diary entries — that is basically a book of you.' },
  { id: 'quiz-whiz', emoji: '🧠', name: 'Quiz Whiz', desc: '10 correct quiz answers in the Quiz Corner.' },
  { id: 'quiz-master', emoji: '🎓', name: 'Quiz Master', desc: '50 correct quiz answers. Word wizard!' },
  { id: 'unstoppable', emoji: '🚀', name: 'Unstoppable', desc: 'A 30-day streak on any task. Incredible!' },
  { id: 'every-day-hero', emoji: '☀️', name: 'Every-Day Hero', desc: 'You did something in Sprout 7 days in a row.' },
  { id: 'picasso', emoji: '🖌️', name: 'Little Picasso', desc: 'You drew 5 doodles in your diary.' },
  { id: 'photographer', emoji: '📸', name: 'Photographer', desc: 'You added 5 photos to your diary.' },
  { id: 'hydro-hero', emoji: '🐬', name: 'Hydro Hero', desc: '50 glasses of water logged. Splash!' },
];

// Compute which badges are newly earned. Returns array of badge ids to insert.
// `stats` is gathered by the store from the db; keeping the conditions here
// keeps catalog + rules in one place.
export function newlyEarnedBadges(stats, alreadyEarned) {
  const earned = new Set(alreadyEarned);
  const out = [];
  const award = (id, cond) => { if (cond && !earned.has(id)) out.push(id); };

  award('first-sprout', stats.totalDone >= 1);
  award('storyteller', stats.diaryEntries >= 1);
  award('week-wonder', stats.activeDays >= 7);
  award('on-a-roll', stats.bestStreak >= 7);
  award('bookworm', stats.pagesTotal >= 100);
  award('page-turner', stats.pagesTotal >= 500);
  award('maestro', stats.musicMinutes >= 300);
  award('crafty-hands', stats.craftsDone >= 5);
  award('deep-thoughts', stats.diaryEntries >= 10);
  award('mood-artist', stats.moodsTagged >= 5);
  award('century-club', stats.totalDone >= 100);
  award('full-bloom', stats.companionStage >= 5);
  award('first-book', stats.booksFinished >= 1);
  award('book-collector', stats.booksFinished >= 5);
  award('mega-bookworm', stats.pagesTotal >= 1000);
  award('novelist', stats.diaryEntries >= 30);
  award('quiz-whiz', stats.quizCorrect >= 10);
  award('quiz-master', stats.quizCorrect >= 50);
  award('unstoppable', stats.bestStreak >= 30);
  award('every-day-hero', stats.consecutiveActiveDays >= 7);
  award('picasso', stats.doodles >= 5);
  award('photographer', stats.photos >= 5);
  award('hydro-hero', stats.waterTotal >= 50);
  return out;
}
