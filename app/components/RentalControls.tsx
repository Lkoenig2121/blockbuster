"use client";

import { useEffect, useMemo, useState } from "react";
import type { Movie } from "../lib/movies";
import {
  defaultRentalState,
  loadRentalState,
  rentMovie,
  returnMovie,
  saveRentalState,
  type RentalState,
} from "../lib/rentals";

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function Pill({
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

export function RentalControls({ movie }: { movie: Movie }) {
  const [state, setState] = useState<RentalState>(defaultRentalState());
  const [durationDays, setDurationDays] = useState<1 | 3 | 5>(3);
  const [rentalsHydrated, setRentalsHydrated] = useState(false);

  useEffect(() => {
    setState(loadRentalState());
    setRentalsHydrated(true);
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

  const rental = state.rentalsByMovieId[movie.id];

  const dueText = useMemo(() => {
    if (!rental) return null;
    return `Due ${formatDate(rental.dueAt)}`;
  }, [rental]);

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "var(--card-border)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Rental length</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill
              active={durationDays === 1}
              onClick={() => setDurationDays(1)}
            >
              1 day
            </Pill>
            <Pill
              active={durationDays === 3}
              onClick={() => setDurationDays(3)}
            >
              3 days
            </Pill>
            <Pill
              active={durationDays === 5}
              onClick={() => setDurationDays(5)}
            >
              5 days
            </Pill>
          </div>
          <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            {rental ? dueText : "Choose a length, then rent this movie."}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!rental ? (
            <PrimaryButton
              onClick={() => setState((s) => rentMovie(s, movie, durationDays))}
            >
              Rent ({durationDays} day{durationDays === 1 ? "" : "s"})
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => setState((s) => returnMovie(s, movie.id))}
            >
              Return
            </PrimaryButton>
          )}
          <SubtleButton
            onClick={() => {
              // quick “refresh” in case rentals changed elsewhere
              setState(loadRentalState());
            }}
          >
            Sync
          </SubtleButton>
        </div>
      </div>
    </div>
  );
}
