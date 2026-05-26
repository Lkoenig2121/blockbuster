export type Movie = {
  id: string;
  title: string;
  year: number;
  genre: string;
  runtimeMinutes?: number;
  rating?: string;
  posterSrc: string;
  synopsis: string;
  /** How many physical copies this store has on shelf (0 = sold out). */
  quantity: number;
};

export const movies = [
  ...Array.from({ length: 1000 }, (_, i) => ({
    id: `movie-${i + 1}`,
    title: `Movie Title ${i + 1}`,
    year: 1980 + (i % 40),
    genre: ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Fantasy"][i % 6],
    runtimeMinutes: 90 + (i % 30),
    rating: ["G", "PG", "PG-13", "R"][i % 4],
    posterSrc: `/posters/movie-${i + 1}.jpg`,
    synopsis: `This is the synopsis for Movie Title ${i + 1}. It is a ${["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Fantasy"][i % 6]} movie released in ${1980 + (i % 40)}.`,
    quantity: i % 17 === 0 ? 0 : 1 + (i % 6),
  }))
];

