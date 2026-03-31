import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RentalControls } from "../../components/RentalControls";

type GhibliFilm = {
  id: string;
  title: string;
  original_title?: string;
  original_title_romanised?: string;
  description: string;
  director: string;
  producer?: string;
  release_date: string;
  running_time?: string;
  rt_score?: string;
  image: string;
  movie_banner: string;
};

function formatRuntime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`https://ghibliapi.vercel.app/films/${id}`, {
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) notFound();
  const film = (await res.json()) as GhibliFilm;
  if (!film?.id) notFound();

  const year = Number.parseInt(film.release_date, 10);
  const runtimeMinutes = Number.parseInt(film.running_time ?? "", 10);
  const score = Number.parseInt(film.rt_score ?? "", 10);

  const movieForRental = {
    id: film.id,
    title: film.title,
    year: Number.isFinite(year) ? year : 0,
    genre: "Animation",
    posterSrc: film.image,
    synopsis: film.description,
  };

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
        <div className="relative h-[220px] w-full sm:h-[320px]">
          <Image
            src={film.movie_banner || film.image}
            alt={`${film.title} banner`}
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

        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[220px_1fr] sm:gap-8 sm:p-8">
          <div className="relative aspect-2/3 w-full overflow-hidden rounded-2xl border sm:max-w-[220px]">
            <div
              className="absolute inset-0"
              style={{ borderColor: "var(--card-border)" }}
            />
            <Image
              src={film.image}
              alt={`${film.title} poster`}
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold opacity-80">
              {Number.isFinite(year) ? year : ""} • Animation
              {Number.isFinite(runtimeMinutes)
                ? ` • ${formatRuntime(runtimeMinutes)}`
                : ""}
              {Number.isFinite(score) ? ` • ${score}%` : ""}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {film.title}
            </h1>

            {(film.original_title || film.original_title_romanised) && (
              <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {film.original_title ? `${film.original_title}` : ""}
                {film.original_title && film.original_title_romanised
                  ? " • "
                  : ""}
                {film.original_title_romanised ?? ""}
              </div>
            )}

            <p
              className="mt-5 text-base leading-7"
              style={{ color: "var(--muted)" }}
            >
              {film.description}
            </p>

            <div className="mt-6">
              <RentalControls movie={movieForRental} />
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
                  {film.director}
                </div>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--card-border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-xs font-semibold opacity-80">Producer</div>
                <div className="mt-1 text-sm font-semibold">
                  {film.producer ?? "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: "rgba(245,196,0,0.4)",
                  color: "var(--bb-yellow)",
                  background: "rgba(245,196,0,0.08)",
                }}
              >
                Posters + banners from API
              </span>
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: "var(--card-border)",
                  color: "var(--muted)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Movie ID: {film.id.slice(0, 8)}…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
