"use client";

import { useMemo, useRef, useState } from "react";

// Evergreen sample clue set — not a real daily Venny, so playing it doesn't
// spoil or consume the day's puzzle. The mechanic below (clues revealed one
// at a time as overlapping circles that converge toward a single typed
// answer, checked live as you type — no separate "guess" button) matches
// the real Venny app, not a tap-a-region Venn diagram.
const ANSWER = "SATURN";

const CIRCLES = [
  { id: "a", color: "#304193", clue: "Has rings" },
  { id: "b", color: "#9446ED", clue: "Sixth from the sun" },
  { id: "c", color: "#E64A41", clue: "Named for a Roman god" },
] as const;

// Positions mirror the real app's 3-circle triangle layout (bottom-left,
// bottom-right, top-center), scaled to a 220px diagram.
const CIRCLE_LAYOUT = [
  { left: 14, top: 78 },
  { left: 96, top: 78 },
  { left: 55, top: 8 },
];
const CIRCLE_SIZE = 110;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function VennyTeaser() {
  const [revealedCount, setRevealedCount] = useState(1);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const letterSlots = useMemo(() => ANSWER.split(""), []);

  function revealNextClue() {
    if (revealedCount < CIRCLES.length) {
      setRevealedCount((c) => c + 1);
    }
  }

  function handleChange(raw: string) {
    if (status === "correct") return;
    const cleanText = raw
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, ANSWER.length);
    setGuess(cleanText);

    if (cleanText.length < ANSWER.length) {
      setStatus("idle");
      return;
    }

    if (normalize(cleanText) === normalize(ANSWER)) {
      setStatus("correct");
    } else {
      setStatus("wrong");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 400);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-venny-2">
          Venny
        </span>
      </div>
      <h3 className="mb-4 text-center text-lg font-semibold text-mw-text-dark md:text-xl">
        Read the clues. Find where they converge.
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="relative h-[220px] w-[220px]">
          {CIRCLES.map((c, i) => {
            const revealed = i < revealedCount;
            const pos = CIRCLE_LAYOUT[i];
            return (
              <div
                key={c.id}
                className={`absolute flex items-center justify-center rounded-full text-center transition-opacity ${
                  revealed ? "animate-circle-in opacity-[0.94]" : "opacity-0"
                }`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  backgroundColor: c.color,
                  zIndex: i,
                }}
              >
                {revealed && (
                  <span className="max-w-[70px] px-1 text-[11px] font-extrabold leading-tight text-white [text-shadow:0_0.5px_1px_rgba(0,0,0,0.2)]">
                    {c.clue}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={revealNextClue}
          disabled={revealedCount >= CIRCLES.length || status === "correct"}
          className="mw-focus-ring rounded-full border border-mw-border bg-white px-4 py-1.5 text-xs font-bold text-mw-text-dark transition-colors hover:border-mw-text-light disabled:opacity-30"
        >
          Reveal next clue
        </button>

        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative flex cursor-text gap-1.5 ${shaking ? "animate-shake" : ""}`}
        >
          {letterSlots.map((_, i) => {
            const revealedChar = status === "correct" ? ANSWER[i] : guess[i];
            return (
              <span
                key={i}
                className={`flex h-8 w-[22px] items-end justify-center border-b-2 pb-0.5 text-base font-bold uppercase text-mw-text-dark ${
                  revealedChar ? "border-[#3b82f6]" : "border-mw-border"
                }`}
              >
                {revealedChar ?? ""}
              </span>
            );
          })}
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={ANSWER.length}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type your guess"
            className="absolute inset-0 h-full w-full cursor-text opacity-0"
          />
        </div>

        {status === "correct" ? (
          <div className="text-center">
            <p className="text-base font-semibold text-mw-text-dark">
              Exactly where they meet — {ANSWER}.
            </p>
            <a
              href="https://playvenny.app"
              target="_blank"
              rel="noreferrer"
              className="mw-focus-ring mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-venny-2"
            >
              Play today&apos;s Venny
              <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : status === "wrong" ? (
          <p className="text-center text-sm font-semibold text-mw-text-muted">
            Not quite yet, try again.
          </p>
        ) : (
          <p className="text-center text-xs text-mw-text-light">
            Tap the letters and type your answer.
          </p>
        )}
      </div>
    </div>
  );
}
