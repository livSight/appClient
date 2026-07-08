export const AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;

export function isAutocompleteQueryReady(
  query: string,
  minLength: number = AUTOCOMPLETE_MIN_QUERY_LENGTH,
): boolean {
  return query.trim().length >= minLength;
}

export function filterInventoryByName<T extends { name: string }>(
  items: readonly T[],
  query: string,
  minLength: number = AUTOCOMPLETE_MIN_QUERY_LENGTH,
): T[] {
  const q = query.trim().toLowerCase();
  if (q.length < minLength) return [];
  return items.filter((item) => item.name.toLowerCase().includes(q));
}
