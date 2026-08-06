export const MIN_REVIEW_COUNT = 48;

export function formatWithCount(text: string, count: number): string {
  return text.replace(/\{count\}/g, String(count));
}

export function isFiveStar(rating: number | null): boolean {
  return rating === null || rating >= 5;
}

export function pickByRating<T>(rating: number | null, fiveStar: T, generic: T): T {
  return isFiveStar(rating) ? fiveStar : generic;
}
