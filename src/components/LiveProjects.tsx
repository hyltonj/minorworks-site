import Image from "next/image";

// Three equal vertical "slides," each a condensed recreation of the real
// product's actual screen — built from live screenshots of playballpark.app,
// playvenny.app, and dappled.minorworks.co, not stock art.

function BallparkGraphic() {
  return (
    <div className="flex h-full w-full flex-col bg-mw-primary">
      <div className="flex items-center justify-between bg-white px-3 py-2">
        <span className="text-[10px] font-extrabold tracking-tight text-mw-primary">
          BALLPARK
        </span>
        <span className="text-[8px] font-semibold text-mw-text-light">
          More ▾
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center p-5">
        <div className="w-full max-w-[210px] rounded-2xl bg-mw-background p-5 shadow-mw-lift">
          <p className="mb-6 text-[13px] font-bold leading-snug">
            <span className="text-mw-accent">Weight</span>{" "}
            <span className="text-mw-primary">of all the ants on Earth</span>
          </p>
          <div className="mb-5 flex items-center gap-2">
            <span className="text-xs text-mw-text-light">−</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-mw-border">
              <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mw-primary/40" />
            </div>
            <span className="text-xs text-mw-text-light">+</span>
          </div>
          <p className="mb-4 text-center text-[11px] font-semibold text-mw-text-muted">
            Somewhere in here.
          </p>
          <div className="mx-auto w-fit rounded-full bg-mw-primary px-5 py-1.5 text-[10px] font-bold text-white">
            Submit
          </div>
        </div>
      </div>
    </div>
  );
}

function VennyGraphic() {
  // Real screenshot of a live Venny puzzle, cropped from the top.
  return (
    <div className="relative h-full w-full bg-white">
      <Image
        src="/screenshots/venny_cropped.png"
        alt="Venny's 3-circle puzzle — Party, Parasite, and MC overlapping"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

function DappledGraphic() {
  // Real screenshot of Dappled's toy library, cropped from the top.
  return (
    <div className="relative h-full w-full bg-dappled-paper">
      <Image
        src="/screenshots/dappled_cropped.png"
        alt="Dappled's toy library — dozens of small colorful interactions"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

type Slide = {
  key: string;
  name: string;
  tagline: string;
  href: string;
  cta: string;
  Graphic: () => React.JSX.Element;
  logo: string;
};

const SLIDES: Slide[] = [
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
    key: "dappled",
    name: "Dappled",
    tagline:
      "Dozens of quiet toys made from color, movement, and sound. Touch, make, focus, or just watch.",
    href: "https://dappled.minorworks.co",
    cta: "Enter Dappled",
    Graphic: DappledGraphic,
    logo: "/logos/dappled-icon.png",
  },
];

export default function LiveProjects() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        Live now
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {SLIDES.map(({ key, name, tagline, href, cta, Graphic, logo }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
          >
            <div className="h-[380px] w-full sm:h-[420px]">
              <Graphic />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-1.5 flex items-center gap-2">
                <Image
                  src={logo}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-md"
                />
                <h3 className="text-sm font-bold text-mw-text-dark">
                  {name}
                </h3>
              </div>
              <p className="mb-4 flex-1 text-[13px] leading-relaxed text-mw-text-muted">
                {tagline}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-mw-accent">
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
