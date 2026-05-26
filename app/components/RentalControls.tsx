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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");
  const skipNextSaveRef = useRef(true);

  // Funny return comments for different durations
  const funnyComments: Record<1 | 3 | 5, string[]> = {
    1: [
      "Hope you like to binge! You've got 24 hours to live with this movie.",
      "1 day? Make it count! Your time is literally ticking.",
      "A whole day! That's like... 4 movie nights worth of commitment.",
      "Enjoy your 1-day romance with this film. It's a quick fling!",
    ],
    3: [
      "3 days to change your life. No pressure!",
      "72 hours. That's 1,728 minutes of movie magic. Do the math!",
      "Three days to become emotionally invested. You got this!",
      "Weekend warrior mode activated! 3 days of pure cinema.",
    ],
    5: [
      "5 days? You're playing the long game. We respect the commitment.",
      "Nearly a week of movie ownership. Live your best life!",
      "5 days to convince yourself you'll watch it. (You won't.)",
      "120 hours of rental paradise. Make every second count!",
    ],
  };

  const getRandomComment = (days: 1 | 3 | 5): string => {
    const comments = funnyComments[days];
    // Generate index based on timestamp to avoid multiple random calls during render
    const index = new Date().getTime() % comments.length;
    return comments[index];
  };

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
  const availableNow = Math.max(0, movie.quantity - (rental ? 1 : 0));
  const isSoldOut = !rental && availableNow <= 0;

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
          {(isSoldOut || availableNow < 12) && (
            <div className="mt-2 text-xs font-semibold">
              <span style={{ color: isSoldOut ? "#FCA5A5" : "var(--bb-yellow)" }}>
                {isSoldOut ? "Sold out" : `Only ${availableNow} left`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!rental ? (
            <PrimaryButton
              disabled={isSoldOut}
              onClick={() => {
                if (!userId) {
                  openLogin();
                  return;
                }
                setShowConfirmModal(true);
              }}
            >
              {isSoldOut
                ? "Sold out"
                : userId
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => {
            console.log("Modal backdrop clicked");
            setShowConfirmModal(false);
          }}
        >
          <div
            className="rounded-2xl border p-6 max-w-sm w-full"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">{movie.title}</h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--muted)" }}
            >
              Rental length: <span className="font-semibold">{durationDays} day{durationDays === 1 ? "" : "s"}</span>
            </p>
            <div className="mt-6 flex gap-3">
              <SubtleButton
                className="flex-1"
                onClick={() => {
                  console.log("Cancel clicked");
                  setShowConfirmModal(false);
                }}
              >
                Cancel
              </SubtleButton>
              <PrimaryButton
                className="flex-1"
                onClick={() => {
                  console.log("Confirm rent clicked");
                  setState((s) => rentMovie(s, movie, durationDays));
                  setShowConfirmModal(false);
                  setSelectedComment(getRandomComment(durationDays));
                  setShowThankYouModal(true);
                }}
              >
                Confirm Rent
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYouModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowThankYouModal(false)}
        >
          <div
            className="rounded-2xl border p-8 max-w-sm w-full text-center"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold">Thanks for Renting!</h2>
            <p className="mt-4 font-semibold" style={{ color: "var(--bb-yellow)" }}>
              {movie.title}
            </p>
            <p className="mt-4 text-sm leading-6" style={{ color: "var(--muted)" }}>
              {selectedComment}
            </p>
            <PrimaryButton
              className="mt-6 w-full"
              onClick={() => setShowThankYouModal(false)}
            >
              Enjoy!
            </PrimaryButton>
          </div>
        </div>
      )}</div>
  );
}
