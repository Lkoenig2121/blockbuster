"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Movie } from "../lib/movies";
import type { Rental } from "../lib/rentals";
import {
  defaultRentalState,
  isRented,
  loadRentalState,
  rentalCount,
  rentMovie,
  rentalStorageKey,
  saveRentalState,
  type RentalState,
} from "../lib/rentals";
import { useAuth } from "./AuthProvider";
import { loadSession } from "../lib/auth";

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

import { BlockbusterLogo } from "./BlockbusterLogo";

export function BlockbusterApp() {
  const { session, hydrated: authHydrated, openLogin, logout } = useAuth();
  const userId = session?.userId ?? null;

  const [view, setView] = useState<View>("browse");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<RentalState>(defaultRentalState());
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [browseDurationDays, setBrowseDurationDays] = useState<1 | 3 | 5>(3);
  const [rentalsHydrated, setRentalsHydrated] = useState(false);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    if (!authHydrated) return;
    skipNextSaveRef.current = true;
    setState(loadRentalState(userId));
    setRentalsHydrated(true);
  }, [authHydrated, userId]);

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
    if (!userId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveRentalState(state, userId);
  }, [state, rentalsHydrated, userId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!userId || e.key !== rentalStorageKey(userId)) return;
      setState(loadRentalState(userId));
    };
    const onSession = () => {
      const uid = loadSession()?.userId ?? null;
      skipNextSaveRef.current = true;
      setState(loadRentalState(uid));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("blockbuster-session", onSession);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("blockbuster-session", onSession);
    };
  }, [userId]);

  const count = rentalCount(state);

  const [selectedCategory, setSelectedCategory] = useState<string | null>("All");

  const genreMap: Record<number, string> = useMemo(
    () => ({
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western",
    }),
    []
  );

  const categories = useMemo(() => {
    const uniqueGenreIds = new Set(
      allMovies.flatMap((movie) => movie.genre.split(", ").map(Number))
    );
    return ["All", ...Array.from(uniqueGenreIds).map((id) => genreMap[id] || "Unknown")];
  }, [allMovies, genreMap]);

  const filteredMovies = useMemo(() => {
    const filtered = !selectedCategory || selectedCategory === "All" 
      ? allMovies 
      : allMovies.filter((movie) =>
          movie.genre
            .split(", ")
            .map((id) => genreMap[Number(id)] || "Unknown")
            .includes(selectedCategory)
        );
    
    // Remove duplicates by ID
    const seen = new Set<string>();
    return filtered.filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
  }, [allMovies, selectedCategory, genreMap]);

  const rentals = useMemo(() => {
    return Object.entries(state.rentalsByMovieId).map(([id, rental]) => {
      const movie = allMovies.find((m) => m.id === id);
      return movie ? { movie, rental } : null;
    }).filter(Boolean) as { movie: Movie; rental: Rental }[];
  }, [state, allMovies, genreMap]);

  const [visibleMovies, setVisibleMovies] = useState(20);

  const loadMoreMovies = () => {
    setVisibleMovies((prev) => prev + 20);
  };

  const displayedMovies = useMemo(
    () => filteredMovies.slice(0, visibleMovies),
    [filteredMovies, visibleMovies, genreMap]
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
          {/* Navbar layout: compact below lg (1024px), full bar at lg+ */}
          <div className="flex flex-col gap-2 py-2 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
            <div className="flex items-center justify-between gap-3 lg:justify-start">
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
                <BlockbusterLogo className="block h-9 w-40" />
              </button>
              <div className="hidden lg:block">
                <div className="text-sm font-semibold">
                  Rent now. Return later.
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  1–3–5‑day rentals • saved per account on this device
                </div>
              </div>

              {/* Shown below lg only (same range as compact nav); must not use sm:hidden or 640–1023px loses auth */}
              <div className="flex items-center gap-2 lg:hidden">
                {session ? (
                  <SubtleButton onClick={logout}>Sign out</SubtleButton>
                ) : (
                  <PrimaryButton onClick={openLogin}>Log in</PrimaryButton>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-2 lg:flex">
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
                {session ? (
                  <>
                    <span
                      className="hidden max-w-30 truncate text-xs font-semibold lg:inline"
                      style={{ color: "var(--muted)" }}
                      title={session.email}
                    >
                      {session.name}
                    </span>
                    <SubtleButton onClick={logout}>Sign out</SubtleButton>
                  </>
                ) : (
                  <PrimaryButton onClick={openLogin}>Log in</PrimaryButton>
                )}
              </nav>

              {/* Mobile nav row */}
              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                {view === "browse" ? (
                  <div className="flex items-center gap-2">
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
              <div className="w-full sm:w-90">
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

            {/* Categories Tabs */}
            <div
              className="categories-tabs flex gap-2 p-4 overflow-x-auto whitespace-nowrap"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#f5c400 #062a63", marginTop: "1rem" }}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setVisibleMovies(20); // Reset visible movies when category changes
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    selectedCategory === category
                      ? "bg-yellow-500 text-blue-900"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Movies Grid */}
            <div className="movies-grid grid grid-cols-2 gap-4 p-4">
              {displayedMovies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.id}`}
                  className="no-underline"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <MoviePoster movie={movie} />
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {visibleMovies < filteredMovies.length && (
              <div className="flex justify-center p-4">
                <button
                  onClick={loadMoreMovies}
                  className="px-6 py-2 rounded-full bg-yellow-500 text-blue-900 font-semibold hover:bg-yellow-600"
                >
                  Load More
                </button>
              </div>
            )}
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
                    <Link
                      key={movie.id}
                      href={`/movies/${movie.id}`}
                      className="flex gap-4 rounded-2xl border p-4"
                      style={{
                        borderColor: "var(--card-border)",
                        textDecoration: "none",
                      }}
                      aria-label={`Open ${movie.title}`}
                    >
                      <MoviePoster movie={movie} />
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold opacity-80">
                            {movie.year} • {movie.genre}
                          </div>
                          <div
                            className="mt-1 block truncate text-lg font-bold tracking-tight"
                            style={{ color: "inherit" }}
                          >
                            {movie.title}
                          </div>
                          <div
                            className="mt-2 text-sm"
                            style={{ color: "var(--muted)" }}
                          >
                            Rented {formatDate(rental.rentedAt)} • Due{" "}
                            <span
                              style={{
                                color: overdue
                                  ? "#FCA5A5"
                                  : "var(--bb-yellow)",
                              }}
                            >
                              {formatDate(rental.dueAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
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
            Fan-made demo UI. Sign in to rent; each account has its own rentals
            saved in this browser.
          </div>
        </div>
      </footer>
    </div>
  );
}
