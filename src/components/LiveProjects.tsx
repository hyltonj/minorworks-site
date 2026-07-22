import Image from "next/image";

// Three equal, restrained cards: Venny | Ballpark | Dappled. No project is
// featured over another — same width, height, radius, border, shadow, and
// internal padding for all three.

function BallparkGraphic() {
  return (
    <div className="flex h-full w-full flex-col bg-mw-primary">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[11px] font-extrabold tracking-tight text-white">
          BALLPARK
        </span>
        <span className="text-[9px] font-semibold text-white/60">
          More ▾
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 bg-mw-background px-5 py-5">
        <p className="text-sm font-bold leading-snug text-mw-primary">
          Weight of all the ants on Earth
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-mw-text-light">−</span>
          <div className="relative h-2 flex-1 rounded-full bg-mw-border">
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mw-primary/40" />
          </div>
          <span className="text-xs text-mw-text-light">+</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-mw-text-muted">
            Somewhere in here.
          </p>
          <div className="rounded-full bg-mw-primary px-4 py-1.5 text-[11px] font-bold text-white">
            Submit
          </div>
        </div>
      </div>
    </div>
  );
}

function VennyGraphic() {
  return (
    <div className="relative h-full w-full bg-white">
      <Image
        src="/screenshots/venny_preview.png"
        alt="Venny's 3-circle puzzle — Party, Parasite, and MC overlapping"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

function DappledGraphic() {
  return (
    <div className="relative h-full w-full bg-dappled-paper">
      <Image
        src="/screenshots/dappled_preview.png"
        alt="Three of Dappled's toys — Constellation, Bloom, and Weave"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

type Project = {
  key: string;
  name: string;
  tagline: string;
  href: string;
  cta: string;
  Graphic: () => React.JSX.Element;
  logo: string;
};

const PROJECTS: Project[] = [
  {
    key: "venny",
    name: "Venny",
    tagline:
      "A daily puzzle about what belongs together — and what sits in between.",
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map(({ key, name, tagline, href, cta, Graphic, logo }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
          >
            <div className="px-[18px] pt-[18px]">
              <div className="relative h-[336px] w-full overflow-hidden rounded-mw-sm">
                <Graphic />
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-6 p-6 md:p-7">
              <div>
                <div className="mb-2 flex items-center gap-2">
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
                <p className="text-[13px] leading-relaxed text-mw-text-muted">
                  {tagline}
                </p>
              </div>
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
