import Image from "next/image";

// Ballpark, Venny, and Dappled have their own prominent cards in
// LiveProjects — this section is everything else: a real but secondary
// project (Rank and File), and what's still taking shape.
//
// Sylly and Fall Line have no real visual identity yet — the teaser art
// below is intentionally restrained and invented (word fragments for
// Sylly, a marble-on-a-diagonal for Fall Line's skiing reference), not a
// claim about what the real products will look like.

function RankAndFileArt() {
  const rows = ["Thriller", "Hotel California", "21", "Back in Black"];
  return (
    <div className="flex h-full min-h-[140px] w-full items-center justify-center bg-mw-primary p-4">
      <div className="w-full max-w-[170px] rounded-xl bg-mw-background p-3 shadow-mw-lift">
        <p className="mb-2 rounded-md bg-[#F3F4F6] py-1 text-center text-[8px] font-extrabold uppercase tracking-wider text-[#152B4D]">
          Rank and File
        </p>
        <p className="text-center text-[10px] font-extrabold text-mw-accent">
          Albums sold
        </p>
        <p className="mb-2 text-center text-[7px] italic text-mw-text-light">
          Most → Least
        </p>
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div
              key={r}
              className="truncate rounded-md border border-mw-border bg-white px-1.5 py-1 text-center text-[7px] font-semibold text-mw-text-dark"
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitedStatsArt() {
  const bars = [30, 55, 40, 70, 50, 85];
  return (
    <div className="flex h-32 items-end justify-center gap-1.5 bg-mw-background pb-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-3 rounded-t-sm bg-mw-primary/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function DealemmaArt() {
  return (
    <div className="relative h-40 w-full bg-[#0f1b2e]">
      <Image
        src="/dealemma/box.jpg"
        alt="Dealemma box art — a card and chip game about betting on what everyone else will do"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function SyllyArt() {
  return (
    <div className="flex h-32 items-center justify-center bg-mw-background">
      <div className="flex items-center text-2xl font-extrabold tracking-tight">
        <span className="animate-sylly-merge text-sylly">syl</span>
        <span className="animate-sylly-merge-right text-mw-primary">ly</span>
      </div>
    </div>
  );
}

function FallLineArt() {
  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden bg-mw-background">
      <svg viewBox="0 0 80 80" className="h-16 w-16 opacity-40">
        <line x1="8" y1="8" x2="72" y2="72" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
      <div className="absolute h-3 w-3 animate-marble rounded-full bg-mw-accent shadow-mw" />
    </div>
  );
}

export default function ProjectCards() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        More from the studio
      </h2>

      <a
        href="https://playballpark.app"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group mb-8 flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift sm:flex-row sm:items-stretch"
      >
        <div className="w-full sm:w-[220px]">
          <RankAndFileArt />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="mb-1 text-base font-bold text-mw-text-dark">
              Rank and File
            </h3>
            <p className="text-sm leading-relaxed text-mw-text-muted">
              A side game and experiment from Minor Works, built right into
              Ballpark — put things in order and see how wrong your
              instincts were.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#152B4D]">
            Play inside Ballpark
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </a>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <UnitedStatsArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              United Stats of America
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              A new project from Minor Works.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-accent">
              Launching soon
            </p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <DealemmaArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              Dealemma
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              A tabletop card game about reading the room.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
              In development
            </p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <SyllyArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">Sylly</h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              A word game, still finding its shape.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
              In development
            </p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <FallLineArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              Fall Line
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              A game about finding the natural line down. Early days.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
              In development
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
