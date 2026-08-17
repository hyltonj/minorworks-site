"use client";

import { useMemo, useState } from "react";

// Evergreen sample round — not one of the real daily five, so playing this
// doesn't spoil or consume actual Three Stars content. The palette, type
// (Bebas Neue for the marquee/actor pills, IBM Plex Mono for the status row
// and letter blanks), and the navy marquee-board / ticket-button treatment
// are pulled straight from the real Three Stars build, not invented.
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
    <div className="flex h-full flex-col overflow-hidden rounded-mw-sm">
      {/* marquee-board */}
      <div className="bg-[#384959] px-4 pb-3 pt-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-1.5">
          {"THREE STARS".split(" ").map((word, wi) => (
            <span key={wi} className="flex">
              {word.split("").map((ch, i) => (
                <span
                  key={i}
                  className="text-xl leading-none text-white"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[11px] italic text-[#BDDDFC]">
          three actors, one movie
        </p>
      </div>

      {/* status row */}
      <div
        className="flex items-center justify-center bg-[#5A6C7C] px-4 py-1.5 text-[11px] font-semibold text-white"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <span>🏆 {points} pts</span>
      </div>

      {/* card */}
      <div className="flex flex-1 flex-col gap-3 bg-[#E4F0FC] px-4 py-4">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#6A89A7]">
          Name the movie
        </p>

        <div className="flex flex-col gap-1.5">
          {ACTORS.map((name) => (
            <div
              key={name}
              className="rounded-full bg-[#88BDF2] px-3 py-1.5 text-center text-sm text-[#1E2933]"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              {name}
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={revealLetter}
            disabled={revealedCount >= totalLetters || status === "correct"}
            className="mw-focus-ring relative rounded-md bg-[#384959] px-5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-opacity disabled:opacity-30"
          >
            <span className="pointer-events-none absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#E4F0FC]" />
            Reveal a letter −1
            <span className="pointer-events-none absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#E4F0FC]" />
          </button>
        </div>

        <div
          className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 rounded-md border border-[#BDDDFC] bg-white px-3 py-3"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {letterSlots.map((slot, i) => {
            if (!slot.isLetter) {
              return (
                <span
                  key={i}
                  className="flex h-6 w-2 items-end justify-center text-sm font-bold text-[#384959]"
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
                className="flex h-6 w-4 items-end justify-center border-b-2 border-[#88BDF2] text-sm font-bold uppercase text-[#1E2933]"
              >
                {revealed ? slot.char : ""}
              </span>
            );
          })}
        </div>

        {status === "correct" ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1E2933]">
              That&apos;s it — {ANSWER}.
            </p>
            <a
              href="https://threestars.minorworks.co"
              target="_blank"
              rel="noreferrer"
              className="mw-focus-ring mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#C0563E]"
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
                className="mw-focus-ring flex-1 rounded-md border border-[#BDDDFC] bg-white px-3 py-2 text-sm text-[#1E2933]"
              />
              <button
                type="button"
                onClick={handleGuess}
                disabled={guess.trim().length === 0}
                className="mw-focus-ring rounded-md bg-[#384959] px-5 py-2 text-sm font-bold text-white transition-opacity disabled:opacity-30"
              >
                Guess
              </button>
            </div>
            {status === "incorrect" && (
              <p className="text-center text-sm font-semibold text-[#6B7684]">
                Not quite.{" "}
                <button
                  type="button"
                  onClick={reset}
                  className="mw-focus-ring font-bold text-[#C0563E] underline underline-offset-4"
                >
                  Start over
                </button>
              </p>
            )}
          </>
        )}
      </div>

      {/* release line */}
      <div className="bg-[#E4F0FC] pb-3 text-center text-[9px] font-semibold uppercase tracking-widest text-[#6A89A7]">
        A Minor Works release
      </div>
    </div>
  );
}
