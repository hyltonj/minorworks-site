"use client";

import { useCallback, useMemo, useState } from "react";

// Evergreen sample clue — not a real daily Venny, so playing it doesn't
// spoil or consume the day's puzzle.
const CIRCLES = [
  { key: "A", label: "Things with rings", cx: 118, cy: 108, r: 84, color: "#304193" },
  { key: "B", label: "Things found in space", cx: 182, cy: 108, r: 84, color: "#9446ED" },
  { key: "C", label: "Things with “moon” in their name", cx: 150, cy: 168, r: 84, color: "#F28D35" },
] as const;

const CORRECT = new Set(["A", "B"]);

const REGIONS: { key: string; label: string; sets: string[] }[] = [
  { key: "A", label: "Rings only", sets: ["A"] },
  { key: "B", label: "Space only", sets: ["B"] },
  { key: "C", label: '"Moon" in the name only', sets: ["C"] },
  { key: "AB", label: "Rings & space", sets: ["A", "B"] },
  { key: "AC", label: 'Rings & "moon" in the name', sets: ["A", "C"] },
  { key: "BC", label: 'Space & "moon" in the name', sets: ["B", "C"] },
  { key: "ABC", label: "All three", sets: ["A", "B", "C"] },
  { key: "NONE", label: "None of these", sets: [] },
];

function regionFromSets(sets: Set<string>): { key: string; label: string } {
  const sorted = [...sets].sort();
  const match = REGIONS.find(
    (r) => r.sets.length === sorted.length && r.sets.every((s) => sorted.includes(s))
  );
  return match ?? REGIONS[REGIONS.length - 1];
}

export default function VennyTeaser() {
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [lastGuessLabel, setLastGuessLabel] = useState<string>("");

  const evaluate = useCallback((sets: Set<string>) => {
    const region = regionFromSets(sets);
    setLastGuessLabel(region.label);
    const isCorrect = sets.size === CORRECT.size && [...CORRECT].every((s) => sets.has(s));
    setStatus(isCorrect ? "correct" : "incorrect");
  }, []);

  const handlePointer = useCallback(
    (clientX: number, clientY: number, svg: SVGSVGElement) => {
      if (status === "correct") return;
      const rect = svg.getBoundingClientRect();
      const viewBoxScaleX = 300 / rect.width;
      const viewBoxScaleY = 260 / rect.height;
      const x = (clientX - rect.left) * viewBoxScaleX;
      const y = (clientY - rect.top) * viewBoxScaleY;

      const sets = new Set<string>();
      for (const c of CIRCLES) {
        const dx = x - c.cx;
        const dy = y - c.cy;
        if (dx * dx + dy * dy <= c.r * c.r) sets.add(c.key);
      }
      evaluate(sets);
    },
    [status, evaluate]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-venny-2">
          Venny
        </span>
      </div>
      <h3 className="mb-4 text-center text-lg font-semibold text-mw-text-dark md:text-xl">
        Where would Saturn go?
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <svg
          viewBox="0 0 300 260"
          role="img"
          aria-label="Venn diagram. Tap the region where Saturn belongs."
          className="w-full max-w-[300px] cursor-pointer touch-none select-none"
          onClick={(e) => handlePointer(e.clientX, e.clientY, e.currentTarget)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handlePointer(e.clientX, e.clientY, e.currentTarget);
          }}
        >
          {CIRCLES.map((c) => (
            <circle
              key={c.key}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              fill={c.color}
              fillOpacity={0.32}
              stroke={c.color}
              strokeOpacity={0.7}
              strokeWidth={1.5}
            />
          ))}
          <text x="30" y="30" fontSize="11" fontWeight={700} fill="#304193">
            Things with rings
          </text>
          <text x="205" y="30" fontSize="11" fontWeight={700} fill="#9446ED" textAnchor="end">
            Found in space
          </text>
          <text x="150" y="252" fontSize="11" fontWeight={700} fill="#c96a1c" textAnchor="middle">
            &quot;Moon&quot; in the name
          </text>
          {status === "correct" ? (
            <text
              x="150"
              y="110"
              fontSize="13"
              fontWeight={800}
              fill="#0f172a"
              textAnchor="middle"
              style={{ transition: "opacity 300ms ease" }}
            >
              Saturn
            </text>
          ) : null}
        </svg>

        <div
          draggable={status !== "correct"}
          onDragStart={(e) => e.dataTransfer.setData("text/plain", "saturn")}
          className={`mw-focus-ring rounded-full border border-mw-border bg-white px-4 py-1.5 text-sm font-bold text-mw-text-dark shadow-mw transition-opacity ${
            status === "correct" ? "cursor-default opacity-0" : "cursor-grab opacity-100"
          }`}
        >
          Saturn
        </div>

        {status === "idle" ? (
          <p className="text-center text-xs text-mw-text-light">
            Drag Saturn onto the diagram, or tap the region you think is right.
          </p>
        ) : status === "correct" ? (
          <div className="text-center">
            <p className="text-base font-semibold text-mw-text-dark">
              Exactly between them.
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
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-mw-text-muted">
              {lastGuessLabel} — not quite. Give it another go.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mw-focus-ring mt-2 text-sm font-bold text-venny-2 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-1.5 pt-1" aria-label="Choose a region using keyboard">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => evaluate(new Set(r.sets))}
              disabled={status === "correct"}
              className="mw-focus-ring rounded-full border border-mw-borderSoft px-2.5 py-1 text-[11px] font-semibold text-mw-text-light transition-colors hover:border-mw-border hover:text-mw-text-muted disabled:opacity-30"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
