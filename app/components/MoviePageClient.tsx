"use client";

import Image from "next/image";
import Link from "next/link";
import { RentalControls } from "./RentalControls";
import type { Movie } from "../lib/movies";

interface MoviePageClientProps {
  movie: Movie & {
    director: string;
    cast: string[];
    runtimeMinutes: number | null;
    genres: string;
    year: number;
    backdrop_path: string | null;
    poster_path: string | null;
    title: string;
    vote_average?: number;
    overview: string;
    budget?: number;
    revenue?: number;
  };
}

export function MoviePageClient({ movie }: MoviePageClientProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ color: "var(--bb-yellow)" }}
        >
          ← Back to browse
        </Link>
      </div>

      <div
        className="overflow-hidden rounded-3xl border"
        style={{ borderColor: "var(--card-border)", background: "var(--card)" }}
      >
        {movie.backdrop_path && (
          <div className="relative h-55 w-full sm:h-80">
            <Image
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={`${movie.title} banner`}
              loading="eager"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,22,52,0.15) 0%, rgba(6,22,52,0.65) 70%, rgba(6,22,52,0.9) 100%)",
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[220px_1fr] sm:gap-8 sm:p-8">
          {movie.poster_path && (
            <div className="relative aspect-2/3 w-full overflow-hidden rounded-2xl border sm:max-w-55">
              <div
                className="absolute inset-0"
                style={{ borderColor: "var(--card-border)" }}
              />
              <Image
                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                alt={`${movie.title} poster`}
                fill
                className="object-cover"
                sizes="220px"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="text-xs font-semibold opacity-80">
              {movie.year} • {movie.genres}
              {movie.runtimeMinutes ? ` • ${movie.runtimeMinutes} mins` : ""}
              {movie.vote_average ? ` • Rated ${movie.vote_average.toFixed(1)}` : ""}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {movie.title}
            </h1>

            <p
              className="mt-5 text-base leading-7"
              style={{ color: "var(--muted)" }}
            >
              {movie.overview}
            </p>

            <div className="mt-6">
              <RentalControls
                movie={{
                  id: movie.id,
                  title: movie.title,
                  year: movie.year,
                  genre: movie.genres,
                  runtimeMinutes: movie.runtimeMinutes,
                  rating: movie.vote_average
                    ? `${movie.vote_average.toFixed(1)}/10`
                    : undefined,
                  posterSrc: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                  synopsis: movie.overview,
                  // This page doesn't load store inventory yet; default to a few copies.
                  quantity: 3,
                }}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--card-border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-xs font-semibold opacity-80">Director</div>
                <div className="mt-1 text-sm font-semibold">
                  {movie.director}
                </div>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--card-border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-xs font-semibold opacity-80">Genres</div>
                <div className="mt-1 text-sm font-semibold">{movie.genres}</div>
              </div>
            </div>

            {/* Cast Section */}
            {movie.cast.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold">Cast</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.cast.map((actor: string, index: number) => (
                    <span
                      key={index}
                      className="rounded-full px-3 py-1 text-sm"
                      style={{
                        borderColor: "var(--card-border)",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details Section */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(movie.budget ?? 0) > 0 && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--card-border)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="text-xs font-semibold opacity-80">Budget</div>
                  <div className="mt-1 text-sm font-semibold">
                    ${(movie.budget! / 1000000).toFixed(1)}M
                  </div>
                </div>
              )}
              {(movie.revenue ?? 0) > 0 && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--card-border)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="text-xs font-semibold opacity-80">Revenue</div>
                  <div className="mt-1 text-sm font-semibold">
                    ${(movie.revenue! / 1000000).toFixed(1)}M
                  </div>
                </div>
              )}
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--card-border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-xs font-semibold opacity-80">Rating</div>
                <div className="mt-1 text-sm font-semibold">
                  {movie.vote_average?.toFixed(1)}/10
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
