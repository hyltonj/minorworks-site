import Image from "next/image";

// Visual recreations below are built from real, current screenshots of each
// live product (captured directly from playballpark.app, playvenny.app, and
// dappled.minorworks.co) rather than stock art — colors and layout match
// what's actually shipping.

function BallparkGraphic() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-mw-primary p-6 md:p-10">
      <div className="w-full max-w-[300px] rounded-2xl bg-mw-background p-6 shadow-mw-lift">
        <p className="mb-7 text-sm font-bold leading-snug">
          <span className="text-mw-accent">Dimensions</span>{" "}
          <span className="text-mw-primary">of a standard basketball hoop</span>
        </p>
        <div className="mb-6 flex items-center gap-2">
          <span className="text-mw-text-light">−</span>
          <div className="relative h-1.5 flex-1 rounded-full bg-mw-border">
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mw-primary/40" />
          </div>
          <span className="text-mw-text-light">+</span>
        </div>
        <p className="mb-4 text-center text-xs font-semibold text-mw-text-muted">
          Somewhere in here.
        </p>
        <div className="mx-auto w-fit rounded-full bg-mw-primary px-6 py-2 text-xs font-bold text-white">
          Submit
        </div>
      </div>
    </div>
  );
}

function VennyGraphic() {
  const letters = [
    { ch: "V", color: "#304193" },
    { ch: "E", color: "#9446ED" },
    { ch: "N", color: "#E64A41" },
    { ch: "N", color: "#F28D35" },
    { ch: "Y", color: "#88C041" },
  ];
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-mw-primary p-5">
      <div className="w-full max-w-[220px] rounded-2xl bg-white p-4 shadow-mw-lift">
        <div className="mb-5 flex justify-center gap-0.5">
          {letters.map((l, i) => (
            <span
              key={i}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.ch}
            </span>
          ))}
        </div>
        <div className="relative mx-auto h-20 w-32">
          <div
            className="absolute left-0 top-0 h-20 w-20 rounded-full opacity-90"
            style={{ backgroundColor: "#5b6a9e" }}
          />
          <div
            className="absolute right-0 top-0 h-20 w-20 rounded-full opacity-90"
            style={{ backgroundColor: "#9446ED" }}
          />
        </div>
      </div>
    </div>
  );
}

function DappledGraphic() {
  const top = ["#FF48B0", "#FF6C2F", "#FFD900"];
  const bottom = ["#00A95C", "#0078BF", "#3A4FD8"];
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-dappled-paper p-5">
      <div className="w-full max-w-[220px] rounded-2xl bg-white p-4 shadow-mw-lift">
        <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-dappled-fade">
          Today&apos;s dapple
        </p>
        <div className="mx-auto grid w-fit grid-cols-3 gap-0">
          {top.map((c, i) => (
            <div
              key={`t${i}`}
              className="h-8 w-8 rounded-full opacity-90"
              style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -6 }}
            />
          ))}
        </div>
        <div className="mx-auto -mt-1.5 grid w-fit grid-cols-3 gap-0">
          {bottom.map((c, i) => (
            <div
              key={`b${i}`}
              className="h-8 w-8 rounded-full opacity-90"
              style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -6 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LiveProjects() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        Live now
      </h2>

      {/* Featured: Ballpark */}
      <a
        href="https://playballpark.app"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group mb-5 grid overflow-hidden rounded-mw shadow-mw-lift md:grid-cols-2"
      >
        <div className="h-[220px] md:h-auto md:min-h-[280px]">
          <BallparkGraphic />
        </div>
        <div className="flex flex-col justify-center bg-white p-8 md:p-10">
          <div className="mb-2 flex items-center gap-2">
            <Image
              src="/logos/ballpark-logo.png"
              alt=""
              width={26}
              height={26}
              className="rounded-md"
            />
            <h3 className="text-lg font-bold text-mw-text-dark">Ballpark</h3>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-mw-text-muted md:text-base">
            A daily game about scale, estimation, and how surprisingly hard
            it is to know how big anything really is.
          </p>
          <span className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-mw-accent">
            Play today&apos;s five
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </div>
      </a>

      {/* Venny + Dappled, smaller, side by side */}
      <div className="grid gap-5 sm:grid-cols-2">
        <a
          href="https://playvenny.app"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <div className="h-[170px] w-full">
            <VennyGraphic />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-1.5 flex items-center gap-2">
              <Image
                src="/logos/venny-logo.png"
                alt=""
                width={20}
                height={20}
                className="rounded-md"
              />
              <h3 className="text-sm font-bold text-mw-text-dark">Venny</h3>
            </div>
            <p className="mb-4 flex-1 text-[13px] leading-relaxed text-mw-text-muted">
              A daily puzzle about what belongs together — and what sits in
              between.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-mw-accent">
              Play today&apos;s Venny
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </a>

        <a
          href="https://dappled.minorworks.co"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <div className="h-[170px] w-full">
            <DappledGraphic />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-1.5 flex items-center gap-2">
              <Image
                src="/logos/dappled-icon.png"
                alt=""
                width={20}
                height={20}
                className="rounded-md"
              />
              <h3 className="text-sm font-bold text-mw-text-dark">Dappled</h3>
            </div>
            <p className="mb-4 flex-1 text-[13px] leading-relaxed text-mw-text-muted">
              Thirty-six quiet toys made from color, movement, and sound.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-mw-accent">
              Enter Dappled
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}
