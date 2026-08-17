"use client";

import { useMemo, useState } from "react";

// Evergreen sample question — deliberately not one of Ballpark's real daily
// questions, so playing this doesn't spoil or consume daily content. The
// wordmark, orange keyword highlight, navy submit button, and the
// "Remaining" row treatment (with its refresh glyph) below all mirror the
// real Ballpark app's actual styling, not an approximation.
const QUESTION = "How many tennis balls would fit inside Fenway Park?";
const HIGHLIGHT_CORE = "tennis balls";
const TARGET_LOG10 = 8.9; // ~ 800 million, filling the stadium bowl
const MIN_LOG10 = 3; // 1 thousand
const MAX_LOG10 = 12; // 1 trillion

const REMAINING = [
  "How many jellybeans fill a standard gumball machine?",
  "How many steps is the walk across the Golden Gate Bridge?",
];

function RefreshGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#cbd5e1"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function formatFromLog10(log10Value: number): string {
  const value = Math.pow(10, log10Value);
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} trillion`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} billion`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} million`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} thousand`;
  return Math.round(value).toLocaleString("en-US");
}

export default function BallparkTeaser() {
  const [logGuess, setLogGuess] = useState<number>((MIN_LOG10 + MAX_LOG10) / 2);
  const [submitted, setSubmitted] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const diff = useMemo(() => Math.abs(logGuess - TARGET_LOG10), [logGuess]);

  const resultLine = useMemo(() => {
    if (diff < 0.15) return "Dead on. That almost never happens.";
    return `You were within ${diff.toFixed(1)} orders of magnitude.`;
  }, [diff]);

  const promptParts = useMemo(
    () => QUESTION.split(new RegExp(`(${HIGHLIGHT_CORE})`, "i")),
    []
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 text-center">
        <span className="text-sm font-black uppercase tracking-[0.2em] text-[#152B4D]">
          Ballpark
        </span>
      </div>
      <h3 className="mb-6 text-center text-lg font-extrabold leading-snug text-mw-text-dark md:text-xl">
        {promptParts.map((part, i) =>
          part.toLowerCase() === HIGHLIGHT_CORE.toLowerCase() ? (
            <span key={i} className="text-[#F28D35]">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </h3>

      <div className="flex-1 flex flex-col justify-center">
        <p className="mb-4 text-center text-sm font-semibold text-mw-text-muted">
          Somewhere in here.
        </p>

        <input
          type="range"
          min={MIN_LOG10}
          max={MAX_LOG10}
          step={0.05}
          value={logGuess}
          disabled={submitted}
          onChange={(e) => {
            setLogGuess(parseFloat(e.target.value));
            setInteracted(true);
          }}
          aria-label="Your estimate, from 1 thousand to 1 trillion tennis balls"
          className="mw-focus-ring h-2 w-full cursor-pointer appearance-none rounded-full bg-mw-borderSoft accent-[#F28D35] disabled:cursor-default"
        />
        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-mw-text-light">
          <span>1 thousand</span>
          <span>1 trillion</span>
        </div>

        {!submitted ? (
          <button
            type="button"
            disabled={!interacted}
            onClick={() => setSubmitted(true)}
            className="mw-focus-ring mt-8 w-full rounded-mw-sm bg-[#152B4D] py-3 text-sm font-bold tracking-wide text-white shadow-mw transition-opacity disabled:opacity-30"
          >
            Make your guess
          </button>
        ) : (
          <div className="mt-8 text-center">
            <p className="text-sm text-mw-text-muted">
              You guessed {formatFromLog10(logGuess)}.
            </p>
            <p className="mt-1 text-base font-semibold text-mw-text-dark">
              {resultLine}
            </p>
            <p className="mt-1 text-sm text-mw-text-muted">
              Our estimate: {formatFromLog10(TARGET_LOG10)} tennis balls.
            </p>
            <a
              href="https://playballpark.app"
              target="_blank"
              rel="noreferrer"
              className="mw-focus-ring mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#152B4D]"
            >
              Play today&apos;s five
              <span aria-hidden="true">→</span>
            </a>
          </div>
        )}

        <div className="mt-8 border-t border-mw-borderSoft pt-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-mw-text-light">
            Remaining
          </p>
          {REMAINING.map((q) => (
            <div
              key={q}
              className="flex items-center gap-3 border-b border-mw-borderSoft py-2.5 last:border-b-0"
            >
              <span className="flex-1 text-sm text-mw-text-muted">{q}</span>
              <RefreshGlyph />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
