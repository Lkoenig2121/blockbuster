import { NextResponse } from "next/server";

type GhibliFilm = {
  id: string;
  title: string;
  description: string;
  release_date: string;
  running_time?: string;
  image: string; // poster-ish
  movie_banner: string; // wide banner
  director: string;
  rt_score: string;
};

export type ApiMovie = {
  id: string;
  title: string;
  year: number;
  genre: string;
  runtimeMinutes?: number;
  rating?: string;
  posterSrc: string;
  bannerSrc?: string;
  director?: string;
  score?: number;
  synopsis: string;
};

export async function GET() {
  const res = await fetch("https://ghibliapi.vercel.app/films", {
    // keep it snappy in dev; ok if occasionally stale
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 502 }
    );
  }

  const films = (await res.json()) as GhibliFilm[];

  const movies: ApiMovie[] = films
    .filter((f) => f && f.id && f.title && f.image)
    .map((f) => {
      const year = Number.parseInt(f.release_date, 10);
      const score = Number.parseInt(f.rt_score, 10);
      const runtimeMinutes = Number.parseInt(f.running_time ?? "", 10);
      const rating =
        Number.isFinite(score) && score >= 90
          ? "PG"
          : Number.isFinite(score) && score >= 75
            ? "PG-13"
            : "G";

      return {
        id: f.id,
        title: f.title,
        year: Number.isFinite(year) ? year : 0,
        genre: "Animation",
        posterSrc: f.image,
        bannerSrc: f.movie_banner,
        director: f.director,
        score: Number.isFinite(score) ? score : undefined,
        runtimeMinutes: Number.isFinite(runtimeMinutes)
          ? runtimeMinutes
          : undefined,
        synopsis: f.description,
        rating,
      };
    })
    .sort((a, b) => (b.year || 0) - (a.year || 0));

  return NextResponse.json({ movies });
}

