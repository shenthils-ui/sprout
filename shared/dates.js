// Date helpers — all dates are local-time "YYYY-MM-DD" strings.

export function toDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, n) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// 0 = Sunday ... 6 = Saturday
export function weekdayOf(dateStr) {
  return parseDateStr(dateStr).getDay();
}

// Days since Unix epoch (local) — used for daily rotation of prompts/words.
export function dayIndex(dateStr) {
  const d = parseDateStr(dateStr);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}

export function monthDays(yearMonth) {
  // yearMonth: "YYYY-MM" -> array of date strings in that month
  const [y, m] = yearMonth.split('-').map(Number);
  const count = new Date(y, m, 0).getDate();
  const out = [];
  for (let i = 1; i <= count; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
  }
  return out;
}

// Does this task apply on this date? expected_days is a JSON array of
// weekday numbers (0-6), or null/empty = every day.
export function taskAppliesOn(task, dateStr) {
  if (!task.expected_days) return true;
  let days;
  try { days = JSON.parse(task.expected_days); } catch { return true; }
  if (!Array.isArray(days) || days.length === 0) return true;
  return days.includes(weekdayOf(dateStr));
}
