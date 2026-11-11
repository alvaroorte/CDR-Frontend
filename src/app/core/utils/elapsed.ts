/** Minutos enteros transcurridos desde una fecha ISO del backend (hora local) hasta {@code now}. */
export function elapsedMinutes(since: string | null, now: number): number {
  if (!since) {
    return 0;
  }
  const start = new Date(since).getTime();
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 60000)) : 0;
}

/** "5 min", "1 h 12 min". */
export function formatElapsed(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
