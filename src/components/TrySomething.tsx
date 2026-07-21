"use client";

import { useState } from "react";
import BallparkTeaser from "./BallparkTeaser";
import VennyTeaser from "./VennyTeaser";

const TABS = [
  { key: "ballpark", label: "Ballpark" },
  { key: "venny", label: "Venny" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function TrySomething() {
  const [active, setActive] = useState<TabKey>("ballpark");

  return (
    <section className="px-6 max-w-[720px] mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-mw-text-muted">
        Try a little something
      </h2>

      <div
        role="tablist"
        aria-label="Choose a game to try"
        className="mb-5 flex justify-center gap-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            id={`tab-${tab.key}`}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setActive(tab.key)}
            className={`mw-focus-ring rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              active === tab.key
                ? "bg-mw-primary text-white"
                : "bg-white text-mw-text-muted border border-mw-border hover:border-mw-text-light"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="min-h-[360px] rounded-mw border border-mw-border bg-white p-6 shadow-mw md:p-8"
      >
        {active === "ballpark" ? <BallparkTeaser /> : <VennyTeaser />}
      </div>
    </section>
  );
}
