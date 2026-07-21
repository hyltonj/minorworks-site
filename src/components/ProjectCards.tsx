// Ballpark, Venny, and Dappled have their own prominent cards in
// LiveProjects — this section is everything else: a real but secondary
// project (Rank and File), and what's still taking shape.
//
// Dealemma's box art hasn't been added as a file yet (it only exists as a
// pasted image, not a saved asset) — this renders a typographic stand-in
// matching the real box art's navy/orange styling until a real photo lands
// at /public/dealemma/box.jpg.

export default function ProjectCards() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-16 md:pb-20">
      <h2 className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-mw-text-light">
        More from the studio
      </h2>

      <a
        href="https://playballpark.app"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group mb-10 flex flex-col items-start gap-4 rounded-mw border border-mw-border bg-white p-6 shadow-mw transition-shadow hover:shadow-mw-lift sm:flex-row sm:items-center"
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw">
          <div className="flex h-40 flex-col items-center justify-center gap-1.5 bg-[#0f1b2e] px-4">
            <p className="text-lg font-bold tracking-wide text-white">
              DE<span className="text-mw-accent">A</span>LEMMA.
            </p>
            <p className="text-center text-[11px] italic text-white/50">
              Bet on what everyone else will do.
            </p>
          </div>
          <div className="p-5">
            <h3 className="mb-1 text-base font-bold text-mw-text-dark">
              Dealemma
            </h3>
            <p className="text-sm leading-relaxed text-mw-text-muted">
              Bet on what everyone else will do. A tabletop card game about
              reading the room.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-mw-text-light">
              In development
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-mw border border-mw-border bg-white p-6 shadow-mw">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-mw-text-light">
            Also in the works
          </p>
          <p className="text-base font-bold text-mw-text-dark">
            Sylly · Fall Line
          </p>
          <p className="mt-2 text-sm text-mw-text-muted">
            Two more still taking shape. More soon.
          </p>
        </div>
      </div>
    </section>
  );
}
