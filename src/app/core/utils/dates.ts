/** Formatea un Date como fecha de negocio 'YYYY-MM-DD' (hora local del navegador). */
export function toIsoDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
