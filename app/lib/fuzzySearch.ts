import type { Movie } from "./movies";

/** Minimum similarity [0, 1] required to include a movie in search results. */
export const FUZZY_MIN_SCORE = 0.7;

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

function ratioSimilarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length);
}

/** Best similarity of query to any same-length window in text (handles typos in partial matches). */
function bestWindowSimilarity(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q.length) return 1;
  if (!t.length) return 0;
  if (t.includes(q)) return 1;

  let best = 0;
  const minW = Math.max(1, q.length - 2);
  const maxW = Math.min(t.length, q.length + 2);
  for (let w = minW; w <= maxW; w++) {
    for (let i = 0; i <= t.length - w; i++) {
      const win = t.slice(i, i + w);
      best = Math.max(best, ratioSimilarity(q, win));
    }
  }
  return best;
}

function fieldScore(query: string, value: string): number {
  const v = value.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q.length) return 1;
  if (!v.length) return 0;
  return Math.max(
    ratioSimilarity(q, v),
    bestWindowSimilarity(q, v),
    ...v.split(/\s+/).map((word) =>
      Math.max(ratioSimilarity(q, word), bestWindowSimilarity(q, word)),
    ),
  );
}

/**
 * Returns a score in [0, 1] for how well `query` matches the movie.
 * Uses the best score across title, genre, year, and rating.
 */
export function fuzzyMovieScore(query: string, movie: Movie): number {
  const q = query.trim().toLowerCase();
  if (!q.length) return 1;

  const parts = [
    movie.title,
    movie.genre,
    String(movie.year),
    movie.rating ?? "",
  ];

  let best = 0;
  for (const p of parts) {
    best = Math.max(best, fieldScore(q, p));
  }
  return best;
}

export function filterMoviesByFuzzyQuery(
  movies: Movie[],
  query: string,
  minScore = FUZZY_MIN_SCORE,
): Movie[] {
  const q = query.trim();
  if (!q.length) return movies;

  const scored = movies
    .map((m) => ({ m, score: fuzzyMovieScore(q, m) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ m }) => m);
}
