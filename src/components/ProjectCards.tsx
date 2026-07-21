// Ballpark, Venny, and Dappled have their own prominent cards in
// LiveProjects — this section is everything else: a real but secondary
// project (Rank and File), and what's still taking shape.
//
// Dealemma's box art hasn't been added as a file yet (it only exists as a
// pasted image, not a saved asset) — this renders a typographic stand-in
// matching the real box art's navy/orange styling until a real photo lands
// at /public/dealemma/box.jpg.
//
// Sylly and Fall Line have no real visual identity yet — the teaser art
// below is intentionally restrained and invented (word fragments for
// Sylly, a marble-on-a-diagonal for Fall Line's skiing reference), not a
// claim about what the real products will look like.

function DealemmaArt() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1.5 bg-[#0f1b2e] px-4">
      <p className="text-lg font-bold tracking-wide text-white">
        DE<span className="text-mw-accent">A</span>LEMMA.
      </p>
      <p className="text-center text-[11px] italic text-white/50">
        Bet on what everyone else will do.
      </p>
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
        className="mw-focus-ring group mb-8 flex flex-col items-start gap-4 rounded-mw border border-mw-border bg-white p-6 shadow-mw transition-shadow hover:shadow-mw-lift sm:flex-row sm:items-center"
      >
        <span
          className="h-1.5 w-8 shrink-0 rounded-full sm:h-8 sm:w-1.5"
          style={{ backgroundColor: "#152B4D" }}
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="mb-1 text-base font-bold text-mw-text-dark">
            Rank and File
          </h3>
          <p className="text-sm leading-relaxed text-mw-text-muted">
            A side game and experiment from Minor Works, built right into
            Ballpark — put things in order and see how wrong your instincts
            were.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#152B4D]">
          Play inside Ballpark
          <span aria-hidden="true">→</span>
        </span>
      </a>

      <div className="grid gap-5 sm:grid-cols-3">
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
