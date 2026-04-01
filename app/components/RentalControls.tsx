"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Movie } from "../lib/movies";
import {
  defaultRentalState,
  loadRentalState,
  rentMovie,
  rentalStorageKey,
  returnMovie,
  saveRentalState,
  type RentalState,
} from "../lib/rentals";
import { loadSession } from "../lib/auth";
import { useAuth } from "./AuthProvider";

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
  const { session, hydrated: authHydrated, openLogin } = useAuth();
  const userId = session?.userId ?? null;

  const [state, setState] = useState<RentalState>(defaultRentalState());
  const [durationDays, setDurationDays] = useState<1 | 3 | 5>(3);
  const [rentalsHydrated, setRentalsHydrated] = useState(false);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    if (!authHydrated) return;
    skipNextSaveRef.current = true;
    setState(loadRentalState(userId));
    setRentalsHydrated(true);
  }, [authHydrated, userId]);

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
              onClick={() => {
                if (!userId) {
                  openLogin();
                  return;
                }
                setState((s) => rentMovie(s, movie, durationDays));
              }}
            >
              {userId
                ? `Rent (${durationDays} day${durationDays === 1 ? "" : "s"})`
                : "Log in to rent"}
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
              setState(loadRentalState(userId));
            }}
          >
            Sync
          </SubtleButton>
        </div>
      </div>
    </div>
  );
}
