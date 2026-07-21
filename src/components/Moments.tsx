// Small recreated snapshots of real interactions across the studio's
// products — not stock art. Each is a simplified, static recreation of a
// moment observed directly in the live apps.

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
    <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border shadow-mw">
      <div
        className="flex h-32 items-center justify-center md:h-36"
        style={{ backgroundColor: bg }}
      >
        {children}
      </div>
      <div className="bg-white px-3 py-2 text-center text-[11px] font-semibold text-mw-text-muted">
        {label}
      </div>
    </div>
  );
}

export default function Moments() {
  return (
    <section className="px-6 max-w-6xl mx-auto pb-16 md:pb-24">
      <h2 className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-mw-text-light">
        A few moments
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile bg="#1e293b" label="Ballpark — the guess">
          <div className="w-24 rounded-full bg-white/15">
            <div className="h-1.5 w-full rounded-full bg-white/20" />
          </div>
        </Tile>

        <Tile bg="#f8fafc" label="Ballpark — the reveal">
          <span className="text-lg font-extrabold text-mw-accent">1.4</span>
        </Tile>

        <Tile bg="#1e293b" label="Venny — two circles">
          <div className="relative h-16 w-24">
            <div className="absolute left-0 h-16 w-16 rounded-full bg-[#5b6a9e]/90" />
            <div className="absolute right-0 h-16 w-16 rounded-full bg-[#9446ED]/90" />
          </div>
        </Tile>

        <Tile bg="#ffffff" label="Venny — the wordmark">
          <div className="flex gap-0.5">
            {["#304193", "#9446ED", "#E64A41", "#F28D35", "#88C041"].map((c, i) => (
              <span
                key={i}
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Tile>

        <Tile bg="#ffffff" label="Rank and File — reorder">
          <div className="flex w-24 flex-col gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 rounded-md border border-mw-border bg-mw-background"
              />
            ))}
          </div>
        </Tile>

        <Tile bg="#F8F5EE" label="Dappled — drift">
          <div className="flex flex-col gap-0">
            <div className="flex" style={{ marginLeft: 8 }}>
              {["#FF48B0", "#FF6C2F", "#FFD900"].map((c, i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full opacity-90"
                  style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -6 }}
                />
              ))}
            </div>
            <div className="flex">
              {["#00A95C", "#0078BF", "#3A4FD8"].map((c, i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full opacity-90"
                  style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -6 }}
                />
              ))}
            </div>
          </div>
        </Tile>

        <Tile bg="#F8F5EE" label="Dappled — ripple">
          <div className="relative h-16 w-16">
            {[16, 11, 6].map((r, i) => (
              <span
                key={i}
                className="absolute rounded-full border-2 border-[#0078BF]"
                style={{
                  width: r * 2,
                  height: r * 2,
                  left: 32 - r,
                  top: 32 - r,
                  opacity: 0.3 + i * 0.25,
                }}
              />
            ))}
          </div>
        </Tile>

        <Tile bg="#F8F5EE" label="Dappled — studio">
          <div className="relative h-16 w-24">
            <span className="absolute left-2 top-2 h-10 w-10 rounded-full bg-[#FF48B0] opacity-70 mix-blend-multiply" />
            <span className="absolute left-8 top-4 h-10 w-10 rounded-full bg-[#3A4FD8] opacity-70 mix-blend-multiply" />
            <span className="absolute left-14 top-1 h-8 w-8 rounded-full bg-[#00A95C] opacity-70 mix-blend-multiply" />
          </div>
        </Tile>
      </div>
    </section>
  );
}
