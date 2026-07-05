import { addDays, taskAppliesOn, todayStr } from './dates.js';

// Kind streak math: a streak counts consecutive "done" days for a task, but
// ONE missed day does not break it (the flame just waits). Two missed days in
// a row ends the streak. Days where the task doesn't apply (expected_days)
// and days marked "skipped" are neutral — they never break a streak.
//
// doneDates: Set of 'YYYY-MM-DD' where the task was done
// skippedDates: Set of dates explicitly marked skipped (neutral)
export function currentStreak(task, doneDates, skippedDates, today = todayStr()) {
  let streak = 0;
  let misses = 0;
  let d = today;
  // Today not being done yet is never a miss — the day isn't over.
  if (doneDates.has(d)) streak++;
  d = addDays(d, -1);
  for (let i = 0; i < 730; i++) {
    if (doneDates.has(d)) {
      streak++;
      misses = 0;
    } else if (!taskAppliesOn(task, d) || skippedDates.has(d)) {
      // neutral day — doesn't count, doesn't break
    } else {
      misses++;
      if (misses >= 2) break;
    }
    d = addDays(d, -1);
  }
  return streak;
}

export function longestStreak(task, doneDates, skippedDates) {
  if (doneDates.size === 0) return 0;
  const sorted = [...doneDates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let best = 0, run = 0, misses = 0;
  let d = first;
  while (d <= last) {
    if (doneDates.has(d)) {
      run++;
      misses = 0;
      if (run > best) best = run;
    } else if (!taskAppliesOn(task, d) || skippedDates.has(d)) {
      // neutral
    } else {
      misses++;
      if (misses >= 2) { run = 0; misses = 0; }
    }
    d = addDays(d, 1);
  }
  return best;
}

// Companion growth: 0..5 stage from the last 7 days of activity.
// Each day earns up to 2 points: 1 for any task done, 1 for a diary entry.
// The companion never shrinks below stage 1 once anything was ever logged —
// it just waits patiently.
export function companionStage(activityPoints, hasAnyHistory) {
  if (activityPoints >= 12) return 5; // blooming
  if (activityPoints >= 9) return 4;  // budding
  if (activityPoints >= 6) return 3;  // leafy plant
  if (activityPoints >= 3) return 2;  // seedling
  if (activityPoints >= 1 || hasAnyHistory) return 1; // sprout
  return 0; // seed
}
