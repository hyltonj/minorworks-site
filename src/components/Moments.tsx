// A dense strip of small, actually-moving snapshots — real CSS motion, not
// static thumbnails. Captions only appear on hover/focus so the strip reads
// as texture first, information second. Respects prefers-reduced-motion
// globally (see globals.css).

function Tile({
  bg,
  label,
  children,
}: {
  bg: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      className="group relative aspect-square overflow-hidden rounded-mw-sm"
      style={{ backgroundColor: bg }}
    >
      <div className="flex h-full w-full items-center justify-center">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/0 to-black/0 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-[10px] font-semibold text-white">{label}</span>
      </div>
    </div>
  );
}

export default function Moments() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        A few moments
      </h2>
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-3">
        <Tile bg="#1e293b" label="Ballpark — the guess">
          <div className="relative h-1.5 w-16 rounded-full bg-white/20">
            <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 animate-slide-bar rounded-full bg-white/70" />
          </div>
        </Tile>

        <Tile bg="#f8fafc" label="Ballpark — the reveal">
          <span className="animate-pop-scale text-xl font-extrabold text-mw-accent">
            1.4
          </span>
        </Tile>

        <Tile bg="#1e293b" label="Venny — two circles">
          <div className="relative h-14 w-20">
            <div className="absolute left-0 h-14 w-14 animate-breathe rounded-full bg-[#5b6a9e]/90" />
            <div
              className="absolute right-0 h-14 w-14 animate-breathe rounded-full bg-[#9446ED]/90"
              style={{ animationDelay: "-1.3s" }}
            />
          </div>
        </Tile>

        <Tile bg="#F8F5EE" label="Dappled — ripple">
          <div className="relative h-14 w-14">
            <span className="absolute inset-0 m-auto h-4 w-4 animate-ring-expand rounded-full border-2 border-[#0078BF]" />
            <span
              className="absolute inset-0 m-auto h-4 w-4 animate-ring-expand rounded-full border-2 border-[#0078BF]"
              style={{ animationDelay: "-1.1s" }}
            />
          </div>
        </Tile>

        <Tile bg="#F8F5EE" label="Dappled — drift">
          <div className="flex gap-1">
            {["#FF48B0", "#3A4FD8", "#00A95C"].map((c, i) => (
              <span
                key={c}
                className="h-6 w-6 animate-breathe rounded-full opacity-90"
                style={{ backgroundColor: c, animationDelay: `-${i * 0.5}s` }}
              />
            ))}
          </div>
        </Tile>

        <Tile bg="#ffffff" label="Rank and File — reorder">
          <div className="flex w-16 flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-3.5 animate-snap-in rounded-md border border-mw-border bg-mw-background"
                style={{ animationDelay: `-${i * 0.35}s` }}
              />
            ))}
          </div>
        </Tile>
      </div>
    </section>
  );
}
