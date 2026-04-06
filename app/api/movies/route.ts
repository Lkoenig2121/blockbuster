import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  genre_ids: number[];
  runtime?: number;
  vote_average?: number;
  poster_path: string;
  overview: string;
}

interface TMDBResponse {
  results: TMDBMovie[];
}

export async function GET() {
  const movies: Array<{
    id: string;
    title: string;
    year: number;
    genre: string;
    runtimeMinutes: number | null;
    rating: string;
    posterSrc: string;
    synopsis: string;
  }> = [];

  const totalPages = 50; // Fetch 50 pages (20 movies per page = 1000 movies)

  for (let page = 1; page <= totalPages; page++) {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch movies from TMDb on page ${page}` },
        { status: 502 }
      );
    }

    const data: TMDBResponse = await res.json();
    const pageMovies = data.results.map((movie) => ({
      id: movie.id.toString(),
      title: movie.title,
      year: new Date(movie.release_date).getFullYear(),
      genre: movie.genre_ids.join(", "), // Replace with genre names if needed
      runtimeMinutes: movie.runtime || null,
      rating: movie.vote_average ? `Rated ${movie.vote_average}` : "Unrated",
      posterSrc: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
      synopsis: movie.overview,
    }));

    movies.push(...pageMovies);
  }

  return NextResponse.json({ movies });
}

