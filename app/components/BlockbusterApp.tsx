"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Movie } from "../lib/movies";
import {
  defaultRentalState,
  isRented,
  loadRentalState,
  rentalCount,
  rentMovie,
  returnMovie,
  saveRentalState,
  sortRentalsByDueDate,
  type RentalState,
} from "../lib/rentals";
import { BlockbusterLogo } from "./BlockbusterLogo";

type View = "browse" | "rentals";

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function RentalPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-full px-3 text-sm font-semibold border transition-colors"
      style={{
        borderColor: active ? "rgba(245,196,0,0.55)" : "var(--card-border)",
        background: active ? "rgba(245,196,0,0.12)" : "rgba(255,255,255,0.03)",
        color: active ? "var(--bb-yellow)" : "var(--foreground)",
      }}
    >
      {children}
    </button>
  );
}

function formatRuntime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function MoviePoster({ movie }: { movie: Movie }) {
  return (
    <div
      className="relative aspect-2/3 w-full overflow-hidden rounded-xl border"
      style={{
        borderColor: "var(--card-border)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <Image
        src={movie.posterSrc}
        alt={`${movie.title} poster`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover"
      />
      <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between">
        <span
          className="rounded-full px-2 py-1 text-[11px] font-semibold"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          {movie.rating ?? "NR"}
        </span>
        <span
          className="rounded-full px-2 py-1 text-[11px] font-semibold"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          {movie.genre}
        </span>
      </div>
    </div>
  );
}

function PrimaryButton(props: React.ComponentProps<"button">) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        "h-11 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        className ?? "",
      ].join(" ")}
      style={{
        background: "var(--bb-yellow)",
        color: "var(--bb-blue-2)",
      }}
    />
  );
}

function SubtleButton(props: React.ComponentProps<"button">) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        "h-11 rounded-full px-4 text-sm font-semibold transition-colors border",
        className ?? "",
      ].join(" ")}
      style={{
        borderColor: "var(--card-border)",
        background: "rgba(255,255,255,0.04)",
        color: "var(--foreground)",
      }}
    />
  );
}

export function BlockbusterApp() {
  const [view, setView] = useState<View>("browse");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<RentalState>(defaultRentalState());
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [browseDurationDays, setBrowseDurationDays] = useState<1 | 3 | 5>(3);
  const [rentalsHydrated, setRentalsHydrated] = useState(false);

  useEffect(() => {
    setState(loadRentalState());
    setRentalsHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMoviesError(null);
        const res = await fetch("/api/movies");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { movies: Movie[] };
        if (cancelled) return;
        setAllMovies(Array.isArray(data.movies) ? data.movies : []);
      } catch {
        if (cancelled) return;
        setMoviesError("Could not load movies right now.");
        setAllMovies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!rentalsHydrated) return;
    saveRentalState(state);
  }, [state, rentalsHydrated]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "blockbuster:rentalState:v1") return;
      setState(loadRentalState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const count = rentalCount(state);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allMovies;
    return allMovies.filter((m) => {
      const hay = `${m.title} ${m.genre} ${m.year} ${m.rating}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, allMovies]);

  const rentals = useMemo(
    () => sortRentalsByDueDate(state, allMovies),
    [state, allMovies],
  );

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,42,99,0.9) 0%, rgba(6,42,99,0.55) 60%, rgba(6,42,99,0.25) 100%)",
        }}
      >
        <div
          className="mx-auto w-full max-w-6xl px-4 sm:px-6"
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView("browse")}
                className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  // keep ring readable on blue header
                  outlineColor: "transparent",
                  boxShadow: "none",
                  color: "inherit",
                  // Tailwind ring offset background isn't set via CSS vars here,
                  // so we keep it subtle and rely on default browser focus as fallback.
                }}
                aria-label="Go to homepage"
                title="Home"
              >
                <BlockbusterLogo className="block h-9 w-[160px]" />
              </button>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold">
                  Rent now. Return later.
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  1-3-5‑day rentals • saved in this browser
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden sm:flex items-center gap-2">
                {view === "browse" ? (
                  <div className="mr-1 flex items-center gap-2">
                    <span className="text-xs font-semibold opacity-80">
                      Rental:
                    </span>
                    <div className="flex items-center gap-1">
                      <RentalPill
                        active={browseDurationDays === 1}
                        onClick={() => setBrowseDurationDays(1)}
                      >
                        1d
                      </RentalPill>
                      <RentalPill
                        active={browseDurationDays === 3}
                        onClick={() => setBrowseDurationDays(3)}
                      >
                        3d
                      </RentalPill>
                      <RentalPill
                        active={browseDurationDays === 5}
                        onClick={() => setBrowseDurationDays(5)}
                      >
                        5d
                      </RentalPill>
                    </div>
                  </div>
                ) : null}
                <SubtleButton
                  onClick={() => setView("browse")}
                  aria-pressed={view === "browse"}
                  style={{
                    ...(view === "browse"
                      ? { background: "rgba(255,255,255,0.08)" }
                      : null),
                    borderColor: "var(--card-border)",
                  }}
                >
                  Browse
                </SubtleButton>
                <SubtleButton
                  onClick={() => setView("rentals")}
                  aria-pressed={view === "rentals"}
                  style={{
                    ...(view === "rentals"
                      ? { background: "rgba(255,255,255,0.08)" }
                      : null),
                    borderColor: "var(--card-border)",
                  }}
                >
                  My Rentals
                  <span
                    className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold"
                    style={{
                      background: "rgba(245,196,0,0.18)",
                      color: "var(--bb-yellow)",
                      border: "1px solid rgba(245,196,0,0.35)",
                    }}
                  >
                    {count}
                  </span>
                </SubtleButton>
              </nav>

              <div className="sm:hidden">
                <SubtleButton
                  onClick={() =>
                    setView((v) => (v === "browse" ? "rentals" : "browse"))
                  }
                >
                  {view === "browse" ? `Rentals (${count})` : "Browse"}
                </SubtleButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {view === "browse" ? (
          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Pick your next movie night
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  Rent a title, then return it from “My Rentals”.
                </p>
              </div>
              <div className="w-full sm:w-[360px]">
                <label className="text-xs font-semibold" htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Title, genre, year..."
                  className="mt-2 h-11 w-full rounded-full border px-4 text-sm outline-none"
                  style={{
                    borderColor: "var(--card-border)",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
            </div>

            {moviesError ? (
              <div
                className="rounded-2xl border p-4 text-sm"
                style={{
                  borderColor: "rgba(252,165,165,0.35)",
                  background: "rgba(252,165,165,0.08)",
                  color: "rgba(243,247,255,0.92)",
                }}
              >
                {moviesError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((movie) => {
                const rented = isRented(state, movie.id);
                return (
                  <article
                    key={movie.id}
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "var(--card-border)",
                      background: "var(--card)",
                    }}
                  >
                    <Link
                      href={`/movies/${movie.id}`}
                      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ textDecoration: "none", color: "inherit" }}
                      aria-label={`Open ${movie.title}`}
                    >
                      <MoviePoster movie={movie} />
                      <div className="mt-4">
                        <div className="text-xs font-semibold opacity-80">
                          {movie.year} • {movie.genre}
                        </div>
                        <div className="mt-1 text-lg font-bold tracking-tight">
                          {movie.title}
                        </div>
                        <p
                          className="mt-2 text-sm"
                          style={{ color: "var(--muted)" }}
                        >
                          {movie.synopsis}
                        </p>
                      </div>
                    </Link>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      {!rented ? (
                        <PrimaryButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setState((s) =>
                              rentMovie(s, movie, browseDurationDays),
                            );
                          }}
                        >
                          Rent ({browseDurationDays} day
                          {browseDurationDays === 1 ? "" : "s"})
                        </PrimaryButton>
                      ) : (
                        <SubtleButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setView("rentals");
                          }}
                          style={{
                            borderColor: "rgba(245,196,0,0.45)",
                            color: "var(--bb-yellow)",
                            background: "rgba(245,196,0,0.08)",
                          }}
                        >
                          Rented
                        </SubtleButton>
                      )}
                      <div
                        className="text-right text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {(movie.rating ?? "NR") +
                          (movie.runtimeMinutes
                            ? ` • ${formatRuntime(movie.runtimeMinutes)}`
                            : "")}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                My Rentals
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Return a movie when you’re done. (This is a demo: no late fees.)
              </p>
            </div>

            {rentals.length === 0 ? (
              <div
                className="rounded-2xl border p-6"
                style={{
                  borderColor: "var(--card-border)",
                  background: "var(--card)",
                }}
              >
                <div className="text-lg font-bold">Nothing rented yet.</div>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  Head back to Browse and rent something for movie night.
                </p>
                <div className="mt-4">
                  <PrimaryButton onClick={() => setView("browse")}>
                    Browse movies
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {rentals.map(({ movie, rental }) => {
                  const overdue = Date.now() > rental.dueAt;
                  return (
                    <div
                      key={movie.id}
                      className="flex gap-4 rounded-2xl border p-4"
                      style={{
                        borderColor: "var(--card-border)",
                      }}
                    >
                      <Link
                        href={`/movies/${movie.id}`}
                        className="w-28 shrink-0"
                        aria-label={`Open ${movie.title}`}
                        style={{ color: "inherit" }}
                      >
                        <MoviePoster movie={movie} />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold opacity-80">
                            {movie.year} • {movie.genre}
                          </div>
                          <Link
                            href={`/movies/${movie.id}`}
                            className="mt-1 block truncate text-lg font-bold tracking-tight"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {movie.title}
                          </Link>
                          <div
                            className="mt-2 text-sm"
                            style={{ color: "var(--muted)" }}
                          >
                            Rented {formatDate(rental.rentedAt)} • Due{" "}
                            <span
                              style={{
                                color: overdue ? "#FCA5A5" : "var(--bb-yellow)",
                                fontWeight: 700,
                              }}
                            >
                              {formatDate(rental.dueAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PrimaryButton
                            onClick={() =>
                              setState((s) => returnMovie(s, movie.id))
                            }
                          >
                            Return
                          </PrimaryButton>
                          <SubtleButton onClick={() => setView("browse")}>
                            Rent more
                          </SubtleButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="pb-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div
            className="rounded-2xl border px-5 py-4 text-sm"
            style={{
              borderColor: "var(--card-border)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--muted)",
            }}
          >
            This is a fan-made demo UI. Rentals are stored locally in your
            browser.
          </div>
        </div>
      </footer>
    </div>
  );
}
