/**
 * Formats a location timestamp cleanly and contextually:
 * - If today: "Hoje, HH:mm"
 * - If yesterday: "Ontem, HH:mm"
 * - If older / past days: "DD/MM/YYYY às HH:mm"
 * - If invalid / absent: "Data indisponível"
 */
export function formatLocationTimestamp(timestamp?: string | null): string {
  if (!timestamp) return 'Data indisponível';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Data indisponível';

  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate();

  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `Hoje, ${timeStr}`;
  }
  if (isYesterday) {
    return `Ontem, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${dateStr} às ${timeStr}`;
}
