import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoviePageClient } from "../../components/MoviePageClient";

export default async function MoviePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;

  console.log("Movie ID:", id);

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US&append_to_response=credits`,
    { next: { revalidate: 60 * 60 } }
  );

  if (!res.ok) {
    console.error("Failed to fetch movie:", res.status, res.statusText);
    notFound();
  }
  
  const movie = await res.json();
  console.log("Movie data:", movie);
  
  // Extract director and cast from credits
  const director = movie.credits?.crew?.find((person: { job: string }) => person.job === "Director")?.name || "Unknown";
  const cast = movie.credits?.cast?.slice(0, 5).map((actor: { name: string }) => actor.name) || [];

  const year = new Date(movie.release_date || new Date()).getFullYear();
  const runtimeMinutes = movie.runtime || null;
  const genres = movie.genres?.length > 0 ? movie.genres.map((genre: { name: string }) => genre.name).join(", ") : "Unknown";

  const movieForRental = {
    id: movie.id.toString(),
    title: movie.title,
    year,
    genre: genres,
    posterSrc: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
    synopsis: movie.overview,
  };

  return (
    <MoviePageClient
      movie={{
        ...movieForRental,
        director,
        cast,
        runtimeMinutes,
        genres,
        year,
        backdrop_path: movie.backdrop_path,
        poster_path: movie.poster_path,
        title: movie.title,
        vote_average: movie.vote_average,
        overview: movie.overview,
      }}
    />
  );
}
