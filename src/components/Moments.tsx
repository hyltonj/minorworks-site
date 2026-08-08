// A 5x5 checkerboard of small, actual moments from across the studio — one
// from nearly every live, beta, and in-development product (Winthrop Cipher
// excluded; it's a narrative banner, not a game/tool with a "moment" to
// show). Motion is hover/focus-triggered rather than auto-looping, so each
// tile feels played-with rather than watched. Captions stay hover-only —
// at 5-across even on mobile, tiles are small enough that always-on text
// would just be noise; the motion itself is the point.
// Respects prefers-reduced-motion globally (see globals.css).

function Tile({
  dark,
  label,
  children,
}: {
  dark: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      className={`group relative aspect-square overflow-hidden rounded-mw-sm ${
        dark ? "bg-mw-primary" : "bg-white"
      }`}
    >
      <div className="flex h-full w-full items-center justify-center">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-[7px] font-semibold leading-tight text-white sm:text-[9px]">
          {label}
        </span>
      </div>
    </div>
  );
}

const TILES: { label: string; content: React.ReactNode }[] = [
  {
    label: "Ballpark — the guess",
    content: (
      <div className="relative h-1.5 w-12 rounded-full bg-white/20 sm:w-14">
        <div className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 group-hover:animate-slide-bar" />
      </div>
    ),
  },
  {
    label: "Ballpark — the reveal",
    content: (
      <span className="text-base font-extrabold text-mw-accent sm:text-lg group-hover:animate-pop-scale">
        1.4
      </span>
    ),
  },
  {
    label: "Venny — the circles",
    content: (
      <div className="relative h-10 w-14 sm:h-12 sm:w-16">
        <div className="absolute left-0 h-10 w-10 rounded-full bg-[#5b6a9e]/90 sm:h-12 sm:w-12 group-hover:animate-breathe" />
        <div
          className="absolute right-0 h-10 w-10 rounded-full bg-[#9446ED]/90 sm:h-12 sm:w-12 group-hover:animate-breathe"
          style={{ animationDelay: "-1.3s" }}
        />
      </div>
    ),
  },
  {
    label: "Venny — the match",
    content: (
      <div className="relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10">
        <span className="absolute inset-0 rounded-full bg-[#88C041]/0 transition-colors duration-300 group-hover:bg-[#88C041]/20" />
        <span className="text-lg text-[#88C041] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          ✓
        </span>
      </div>
    ),
  },
  {
    label: "Dappled — Still",
    content: (
      <div className="relative h-10 w-10 sm:h-12 sm:w-12">
        <span className="absolute inset-0 m-auto h-3 w-3 rounded-full border-2 border-[#0078BF] opacity-0 group-hover:opacity-100 group-hover:animate-ring-expand" />
        <span
          className="absolute inset-0 m-auto h-3 w-3 rounded-full border-2 border-[#0078BF] opacity-0 group-hover:opacity-100 group-hover:animate-ring-expand"
          style={{ animationDelay: "-1.1s" }}
        />
      </div>
    ),
  },
  {
    label: "Dappled — Current",
    content: (
      <div className="flex gap-1">
        {["#FF48B0", "#3A4FD8", "#00A95C"].map((c, i) => (
          <span
            key={c}
            className="h-4 w-4 rounded-full opacity-90 sm:h-5 sm:w-5 group-hover:animate-breathe"
            style={{ backgroundColor: c, animationDelay: `-${i * 0.5}s` }}
          />
        ))}
      </div>
    ),
  },
  {
    label: "Dappled — Flock",
    content: (
      <div className="flex items-end gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/70 group-hover:animate-drift-slow"
            style={{ animationDelay: `-${i * 0.4}s` }}
          />
        ))}
      </div>
    ),
  },
  {
    label: "Dappled — Orbit",
    content: (
      <div className="relative h-9 w-9 sm:h-10 sm:w-10">
        <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-mw-text-light/50" />
        <div className="absolute inset-0 group-hover:animate-orbit">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#3A4FD8]" />
        </div>
      </div>
    ),
  },
  {
    label: "Rank and File — reorder",
    content: (
      <div className="flex w-12 flex-col gap-1 sm:w-14">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 rounded-md bg-white/20 sm:h-2.5 group-hover:animate-snap-in"
            style={{ animationDelay: `-${i * 0.35}s` }}
          />
        ))}
      </div>
    ),
  },
  {
    label: "Rank and File — the rank",
    content: (
      <div className="flex gap-1.5 sm:gap-2">
        {["1", "2", "3"].map((n, i) => (
          <span
            key={n}
            className="text-xs font-extrabold text-mw-text-dark opacity-0 transition-opacity duration-300 sm:text-sm group-hover:opacity-100"
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            {n}
          </span>
        ))}
      </div>
    ),
  },
  {
    label: "QR Tipsheet — the scan",
    content: (
      <div className="relative h-9 w-9 overflow-hidden rounded-sm bg-mw-background sm:h-10 sm:w-10">
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[1px] p-1">
          {[...Array(9)].map((_, i) => (
            <span
              key={i}
              className={`bg-mw-primary ${
                [0, 2, 4, 6, 8].includes(i) ? "opacity-100" : "opacity-15"
              }`}
            />
          ))}
        </div>
        <span className="absolute inset-y-0 left-0 w-[3px] bg-mw-accent opacity-0 group-hover:opacity-100 group-hover:animate-sweep" />
      </div>
    ),
  },
  {
    label: "Dealemma — the bet",
    content: (
      <div className="flex h-9 w-7 items-center justify-center rounded-sm bg-[#0f1b2e] text-xs font-extrabold text-white sm:h-10 sm:w-8 group-hover:animate-flip">
        B
      </div>
    ),
  },
  {
    label: "Dealemma — the reveal",
    content: (
      <div className="flex gap-1">
        <span className="h-4 w-4 rounded-full bg-white transition-transform duration-500 sm:h-5 sm:w-5 group-hover:-translate-x-1.5" />
        <span className="h-4 w-4 rounded-full bg-mw-accent transition-transform duration-500 sm:h-5 sm:w-5 group-hover:translate-x-1.5" />
      </div>
    ),
  },
  {
    label: "Sylly — the merge",
    content: (
      <div className="flex items-center text-base font-extrabold tracking-tight sm:text-lg">
        <span className="text-sylly group-hover:animate-sylly-merge">syl</span>
        <span className="text-mw-text-dark group-hover:animate-sylly-merge-right">
          ly
        </span>
      </div>
    ),
  },
  {
    label: "Sylly — the split",
    content: (
      <div className="flex items-center text-base font-extrabold tracking-tight text-white sm:text-lg">
        <span className="transition-transform duration-500 group-hover:-translate-x-1.5">
          syl
        </span>
        <span className="transition-transform duration-500 group-hover:translate-x-1.5">
          ly
        </span>
      </div>
    ),
  },
  {
    label: "Unsaid — the focus",
    content: (
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-mw-primary opacity-30 blur-[2.4px] transition-all duration-500 group-hover:opacity-100 group-hover:blur-0" />
        <span
          className="h-1.5 w-1.5 rounded-full bg-mw-primary opacity-50 blur-[1.8px] transition-all duration-500 group-hover:opacity-100 group-hover:blur-0"
          style={{ transitionDelay: "80ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-mw-primary opacity-70 blur-[1.2px] transition-all duration-500 group-hover:opacity-100 group-hover:blur-0"
          style={{ transitionDelay: "160ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-mw-primary opacity-90 blur-[0.6px] transition-all duration-500 group-hover:opacity-100 group-hover:blur-0"
          style={{ transitionDelay: "240ms" }}
        />
        <span className="h-1.5 w-1.5 rounded-full bg-mw-primary" />
      </div>
    ),
  },
  {
    label: "United Stats — the compare",
    content: (
      <div className="flex w-12 flex-col gap-1.5 sm:w-14">
        <div className="h-1.5 w-[30%] rounded-full bg-[#ef4444]/70 transition-all duration-700 sm:h-2 group-hover:w-[75%]" />
        <div className="h-1.5 w-[30%] rounded-full bg-white/40 transition-all duration-700 sm:h-2 group-hover:w-[45%]" />
      </div>
    ),
  },
  {
    label: "United Stats — the highlight",
    content: (
      <span className="rounded-full bg-mw-primary px-2 py-1 text-[9px] font-bold text-white opacity-70 transition-all duration-300 sm:text-[10px] group-hover:scale-110 group-hover:opacity-100">
        MA
      </span>
    ),
  },
  {
    label: "Throughline — the turn",
    content: (
      <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-white/40 text-white/70 transition-transform duration-500 sm:h-10 sm:w-10 group-hover:rotate-90">
        ↝
      </div>
    ),
  },
  {
    label: "Throughline — the connect",
    content: (
      <div className="relative h-1.5 w-12 rounded-full bg-mw-border sm:w-14">
        <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-[#647992] transition-all duration-700 group-hover:w-full" />
      </div>
    ),
  },
  {
    label: "Three Stars — the flip",
    content: (
      <div className="flex gap-1">
        {["T", "H", "R"].map((l, i) => (
          <span
            key={l}
            className="flex h-5 w-5 items-center justify-center rounded-md bg-[#8FB8E8] text-[10px] font-extrabold text-mw-primary sm:h-6 sm:w-6 sm:text-xs group-hover:animate-flip"
            style={{ animationDelay: `-${i * 0.15}s` }}
          >
            {l}
          </span>
        ))}
      </div>
    ),
  },
  {
    label: "Three Stars — the guess",
    content: (
      <div className="rounded-md bg-mw-primary px-2 py-1 text-[8px] font-extrabold uppercase text-white opacity-70 transition-all duration-300 sm:px-3 sm:py-1.5 sm:text-[9px] group-hover:-translate-y-0.5 group-hover:opacity-100">
        Molly Ringwald
      </div>
    ),
  },
  {
    label: "Margin — the tally",
    content: (
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-[#cf5727] text-[7px] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          ✓
        </span>
        <span className="text-xs font-extrabold text-white sm:text-sm group-hover:animate-pop-scale">
          $1,757
        </span>
      </div>
    ),
  },
  {
    label: "Once Upon a Photo — the detail",
    content: (
      <div className="relative flex h-9 w-14 items-center justify-center text-center sm:h-10 sm:w-16">
        <span className="absolute font-serif text-lg italic text-[#a45338] transition-opacity duration-300 group-hover:opacity-0">
          O
        </span>
        <span className="absolute px-1 text-[8px] italic leading-tight text-mw-text-muted opacity-0 transition-opacity duration-300 sm:text-[9px] group-hover:opacity-100">
          &ldquo;1958 Studebaker.&rdquo;
        </span>
      </div>
    ),
  },
  {
    label: "Highlightr — the save",
    content: (
      <div className="relative w-14 sm:w-16">
        <span className="block text-[8px] leading-snug text-white/70 sm:text-[9px]">
          the remaining four hyperscalers
        </span>
        <span className="absolute inset-y-0 left-0 w-0 bg-[#97792c]/50 opacity-0 group-hover:w-full group-hover:opacity-100 group-hover:animate-sweep" />
      </div>
    ),
  },
];

export default function Moments() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        A few moments
      </h2>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {TILES.map((tile, i) => (
          <Tile key={tile.label} dark={i % 2 === 0} label={tile.label}>
            {tile.content}
          </Tile>
        ))}
      </div>
    </section>
  );
}
