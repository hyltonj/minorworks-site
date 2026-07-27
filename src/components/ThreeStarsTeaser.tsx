"use client";

import { useMemo, useState } from "react";

// Evergreen sample round — not one of the real daily five, so playing this
// doesn't spoil or consume actual Three Stars content.
const ACTORS = ["Tom Hanks", "Robin Wright", "Gary Sinise"];
const ANSWER = "Forrest Gump";
const STARTING_POINTS = 10;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ThreeStarsTeaser() {
  const [revealedCount, setRevealedCount] = useState(0);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">(
    "idle"
  );

  const letterSlots = useMemo(
    () =>
      ANSWER.split("").map((ch) => ({
        char: ch,
        isLetter: /[a-zA-Z]/.test(ch),
      })),
    []
  );

  const totalLetters = useMemo(
    () => letterSlots.filter((s) => s.isLetter).length,
    [letterSlots]
  );

  const points = Math.max(0, STARTING_POINTS - revealedCount);

  function revealLetter() {
    if (revealedCount < totalLetters) {
      setRevealedCount((c) => c + 1);
      setStatus("idle");
    }
  }

  function handleGuess() {
    if (normalize(guess) === normalize(ANSWER)) {
      setStatus("correct");
    } else {
      setStatus("incorrect");
    }
  }

  function reset() {
    setRevealedCount(0);
    setGuess("");
    setStatus("idle");
  }

  let seen = 0;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-mw-accent">
          Three Stars
        </span>
      </div>
      <h3 className="mb-5 text-center text-lg font-semibold text-mw-text-dark md:text-xl">
        Three actors. One movie. Name it.
      </h3>

      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="flex flex-col gap-2">
          {ACTORS.map((name) => (
            <div
              key={name}
              className="rounded-mw-sm bg-mw-primary/[0.06] px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-mw-primary"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-mw-text-muted">
          <span>🏆 {points} pts</span>
          <button
            type="button"
            onClick={revealLetter}
            disabled={
              revealedCount >= totalLetters || status === "correct"
            }
            className="mw-focus-ring rounded-full border border-mw-border bg-white px-3 py-1 font-bold text-mw-text-dark transition-colors hover:border-mw-text-light disabled:opacity-30"
          >
            Reveal a letter −1
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 rounded-mw-sm border border-mw-border bg-mw-background px-3 py-3">
          {letterSlots.map((slot, i) => {
            if (!slot.isLetter) {
              return (
                <span
                  key={i}
                  className="flex h-7 w-2 items-end justify-center text-base font-bold text-mw-text-dark"
                >
                  {slot.char}
                </span>
              );
            }
            seen += 1;
            const revealed = seen <= revealedCount || status === "correct";
            return (
              <span
                key={i}
                className="flex h-7 w-5 items-end justify-center border-b-2 border-mw-border text-base font-bold uppercase text-mw-text-dark"
              >
                {revealed ? slot.char : ""}
              </span>
            );
          })}
        </div>

        {status === "correct" ? (
          <div className="text-center">
            <p className="text-base font-semibold text-mw-text-dark">
              That&apos;s it — {ANSWER}.
            </p>
            <a
              href="https://threestars.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="mw-focus-ring mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-mw-accent"
            >
              Play today&apos;s five
              <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGuess();
                }}
                placeholder="Your guess"
                aria-label="Your guess for the shared film"
                className="mw-focus-ring flex-1 rounded-mw-sm border border-mw-border px-3 py-2 text-sm text-mw-text-dark"
              />
              <button
                type="button"
                onClick={handleGuess}
                disabled={guess.trim().length === 0}
                className="mw-focus-ring rounded-mw-sm bg-mw-primary px-5 py-2 text-sm font-bold text-white transition-opacity disabled:opacity-30"
              >
                Guess
              </button>
            </div>
            {status === "incorrect" && (
              <p className="text-center text-sm font-semibold text-mw-text-muted">
                Not quite.{" "}
                <button
                  type="button"
                  onClick={reset}
                  className="mw-focus-ring font-bold text-mw-accent underline underline-offset-4"
                >
                  Start over
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
