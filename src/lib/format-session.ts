/** Ported from focus_session_formatting.dart's formatDuration. */
export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Ported from format_session_record.dart. */
export function formatMinutes(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/** Ported from completion_view.dart's `_formatMinutes`. */
export function formatFocusedSummary(totalSeconds: number): string {
  const minutes = totalSeconds / 60;
  if (minutes < 1) return `${Math.floor(totalSeconds)}s`;
  return `${Math.round(minutes)}m`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Ported from format_session_record.dart. */
export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const hour12 = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() < 12 ? "AM" : "PM";
  const time = `${hour12}:${minute} ${period}`;

  if (isToday) return `Today, ${time}`;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${time}`;
}
