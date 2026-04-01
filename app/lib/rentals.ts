import type { Movie } from "./movies";

export type Rental = {
  movieId: string;
  rentedAt: number; // epoch ms
  dueAt: number; // epoch ms
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Per-user rental bucket in localStorage. */
export function rentalStorageKey(userId: string) {
  return `blockbuster:rentalState:v1:${userId}`;
}

export type RentalState = {
  rentalsByMovieId: Record<string, Rental>;
};

export function defaultRentalState(): RentalState {
  return { rentalsByMovieId: {} };
}

export function loadRentalState(userId: string | null): RentalState {
  if (typeof window === "undefined" || !userId) return defaultRentalState();
  try {
    const raw = window.localStorage.getItem(rentalStorageKey(userId));
    if (!raw) return defaultRentalState();
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("rentalsByMovieId" in parsed)
    ) {
      return defaultRentalState();
    }
    const rentalsByMovieId = (parsed as RentalState).rentalsByMovieId ?? {};
    if (!rentalsByMovieId || typeof rentalsByMovieId !== "object") {
      return defaultRentalState();
    }
    return { rentalsByMovieId };
  } catch {
    return defaultRentalState();
  }
}

export function saveRentalState(state: RentalState, userId: string | null) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(
    rentalStorageKey(userId),
    JSON.stringify(state),
  );
}

export function isRented(state: RentalState, movieId: string) {
  return Boolean(state.rentalsByMovieId[movieId]);
}

export function rentMovie(
  state: RentalState,
  movie: Movie,
  durationDays = 3,
  now = Date.now()
): RentalState {
  const rentedAt = now;
  const safeDays = durationDays === 1 || durationDays === 3 || durationDays === 5
    ? durationDays
    : 3;
  const dueAt = now + safeDays * ONE_DAY_MS;
  return {
    rentalsByMovieId: {
      ...state.rentalsByMovieId,
      [movie.id]: { movieId: movie.id, rentedAt, dueAt },
    },
  };
}

export function returnMovie(state: RentalState, movieId: string): RentalState {
  if (!state.rentalsByMovieId[movieId]) return state;
  const { [movieId]: _removed, ...rest } = state.rentalsByMovieId;
  return { rentalsByMovieId: rest };
}

export function rentalCount(state: RentalState) {
  return Object.keys(state.rentalsByMovieId).length;
}

export function sortRentalsByDueDate(
  state: RentalState,
  allMovies: Movie[]
) {
  const byId = new Map(allMovies.map((m) => [m.id, m]));
  return Object.values(state.rentalsByMovieId)
    .map((r) => ({ rental: r, movie: byId.get(r.movieId) }))
    .filter((x): x is { rental: Rental; movie: Movie } => Boolean(x.movie))
    .sort((a, b) => a.rental.dueAt - b.rental.dueAt);
}

