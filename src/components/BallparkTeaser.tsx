"use client";

import { useMemo, useState } from "react";

// Evergreen sample question — deliberately not one of Ballpark's real daily
// questions, so playing this doesn't spoil or consume daily content.
const QUESTION = "How many tennis balls would fit inside Fenway Park?";
const TARGET_LOG10 = 8.9; // ~ 800 million, filling the stadium bowl
const MIN_LOG10 = 3; // 1 thousand
const MAX_LOG10 = 12; // 1 trillion

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

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-mw-accent">
          Ballpark
        </span>
      </div>
      <h3 className="mb-6 text-center text-lg font-semibold text-mw-text-dark md:text-xl">
        {QUESTION}
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
          className="mw-focus-ring h-2 w-full cursor-pointer appearance-none rounded-full bg-mw-borderSoft accent-mw-accent disabled:cursor-default"
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
            className="mw-focus-ring mt-8 w-full rounded-mw-sm bg-mw-primary py-3 text-sm font-bold tracking-wide text-white transition-opacity disabled:opacity-30"
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
              className="mw-focus-ring mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-mw-accent"
            >
              Play today&apos;s five
              <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
