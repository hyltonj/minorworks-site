import Image from "next/image";

// Visual recreations below are built from real, current screenshots of each
// live product (captured directly from playballpark.app, playvenny.app, and
// dappled.minorworks.co) rather than stock art — colors and layout match
// what's actually shipping.

function BallparkGraphic() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-mw-primary p-6">
      <div className="w-full max-w-[260px] rounded-2xl bg-mw-background p-5 shadow-mw-lift">
        <p className="mb-6 text-[13px] font-bold leading-snug">
          <span className="text-mw-accent">Dimensions</span>{" "}
          <span className="text-mw-primary">of a standard basketball hoop</span>
        </p>
        <div className="mb-5 flex items-center gap-2">
          <span className="text-mw-text-light">−</span>
          <div className="relative h-1.5 flex-1 rounded-full bg-mw-border">
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mw-primary/40" />
          </div>
          <span className="text-mw-text-light">+</span>
        </div>
        <div className="mx-auto w-fit rounded-full bg-mw-primary px-6 py-2 text-[11px] font-bold text-white">
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
    <div className="relative flex h-full w-full items-center justify-center bg-mw-primary p-6">
      <div className="w-full max-w-[260px] rounded-2xl bg-white p-5 shadow-mw-lift">
        <div className="mb-6 flex justify-center gap-0.5">
          {letters.map((l, i) => (
            <span
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.ch}
            </span>
          ))}
        </div>
        <div className="relative mx-auto h-24 w-40">
          <div
            className="absolute left-0 top-0 h-24 w-24 rounded-full opacity-90"
            style={{ backgroundColor: "#5b6a9e" }}
          />
          <div
            className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-90"
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
    <div className="relative flex h-full w-full items-center justify-center bg-dappled-paper p-6">
      <div className="w-full max-w-[260px] rounded-2xl bg-white p-5 shadow-mw-lift">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-widest text-dappled-fade">
          Today&apos;s dapple
        </p>
        <div className="mx-auto grid w-fit grid-cols-3 gap-0">
          {top.map((c, i) => (
            <div
              key={`t${i}`}
              className="h-10 w-10 rounded-full opacity-90"
              style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -8 }}
            />
          ))}
        </div>
        <div className="mx-auto -mt-2 grid w-fit grid-cols-3 gap-0">
          {bottom.map((c, i) => (
            <div
              key={`b${i}`}
              className="h-10 w-10 rounded-full opacity-90"
              style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -8 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type LiveProject = {
  key: string;
  name: string;
  tagline: string;
  href: string;
  cta: string;
  Graphic: () => React.JSX.Element;
  logo: string;
};

const LIVE_PROJECTS: LiveProject[] = [
  {
    key: "ballpark",
    name: "Ballpark",
    tagline:
      "A daily game about scale, estimation, and how surprisingly hard it is to know how big anything really is.",
    href: "https://playballpark.app",
    cta: "Play today's five",
    Graphic: BallparkGraphic,
    logo: "/logos/ballpark-logo.png",
  },
  {
    key: "venny",
    name: "Venny",
    tagline: "A daily puzzle about what belongs together — and what sits in between.",
    href: "https://playvenny.app",
    cta: "Play today's Venny",
    Graphic: VennyGraphic,
    logo: "/logos/venny-logo.png",
  },
  {
    key: "dappled",
    name: "Dappled",
    tagline:
      "Thirty-six quiet toys made from color, movement, and sound. Touch, make, focus, or just watch.",
    href: "https://dappled.minorworks.co",
    cta: "Enter Dappled",
    Graphic: DappledGraphic,
    logo: "/logos/dappled-icon.png",
  },
];

export default function LiveProjects() {
  return (
    <section className="px-6 max-w-6xl mx-auto pb-16 md:pb-24">
      <h2 className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-mw-text-light">
        Live now
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {LIVE_PROJECTS.map(({ key, name, tagline, href, cta, Graphic, logo }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
          >
            <div className="h-[240px] w-full">
              <Graphic />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-2 flex items-center gap-2">
                <Image
                  src={logo}
                  alt=""
                  width={22}
                  height={22}
                  className="rounded-md"
                />
                <h3 className="text-base font-bold text-mw-text-dark">{name}</h3>
              </div>
              <p className="mb-5 flex-1 text-sm leading-relaxed text-mw-text-muted">
                {tagline}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-mw-accent">
                {cta}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
