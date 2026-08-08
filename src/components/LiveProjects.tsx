import Image from "next/image";

// Six cards in two rows. Row one (Dappled, Ballpark, Venny) is the
// established flagship trio. Row two (United Stats, Throughline, Three
// Stars) is real and playable but newer — marked "In Beta" rather than
// given full parity, until they've had more runway. Each preview is a
// purpose-built composition or a real screenshot — never cropped through a
// logo, circle, tile, or control.

function VennyArtboard() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-7 bg-white px-6 py-6">
      <Image
        src="/logos/venny-wordmark.png"
        alt="Venny"
        width={178}
        height={46}
        className="h-auto w-[178px]"
      />
      <div className="relative h-[148px] w-[168px]">
        <div className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-venny-3/85" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-venny-1/85" />
        <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-venny-2/85" />
      </div>
    </div>
  );
}

function BallparkArtboard() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white p-5">
      <div className="w-full max-w-[230px] origin-center scale-[1.13] overflow-hidden rounded-2xl bg-white shadow-mw-lift">
        <div className="flex items-center justify-between border-b border-mw-border px-4 py-2.5">
          <Image
            src="/logos/ballpark-wordmark.png"
            alt="Ballpark"
            width={108}
            height={18}
            className="h-auto w-[108px]"
          />
          <span className="text-[9px] font-semibold text-mw-text-light">
            More ▾
          </span>
        </div>
        <div className="flex flex-col gap-4 bg-mw-background px-5 py-5">
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
    </div>
  );
}

function DappledArtboard() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-dappled-paper p-2">
      <div className="relative h-full w-full">
        <Image
          src="/screenshots/dappled_tiles.png"
          alt="Four of Dappled's toys — Still, Current, Flock, and Orbit"
          fill
          sizes="(min-width: 640px) 33vw, 100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}

function UnitedStatsArtboard() {
  return (
    <div className="relative h-full w-full bg-dappled-paper">
      <Image
        src="/screenshots/united3.png"
        alt="United Stats of America — a state-by-state data explorer for offbeat subjects like Bigfoot sightings and Waffle Houses"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

function ThroughlineArtboard() {
  return (
    <div className="relative h-full w-full bg-[#647992]">
      <Image
        src="/throughline/board.png"
        alt="Throughline's hexagonal tile board — turn each tile to route the ball home"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function ThreeStarsArtboard() {
  const words = ["THREE", "STARS"];
  const actors = ["Molly Ringwald", "Anthony Michael Hall", "John Cusack"];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-7 bg-mw-primary px-7 py-10">
      <div className="flex items-center justify-center gap-2">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-[2px]">
            {word.split("").map((letter, i) => (
              <span
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded-md bg-[#8FB8E8] text-[10px] font-extrabold text-mw-primary"
              >
                {letter}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="flex w-full max-w-[240px] flex-col gap-3">
        {actors.map((name) => (
          <div
            key={name}
            className="rounded-lg bg-white px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-mw-primary"
          >
            {name}
          </div>
        ))}
      </div>
      <p className="text-center text-sm italic leading-snug text-white/80">
        &ldquo;Teen comedy about a forgotten birthday.&rdquo;
      </p>
    </div>
  );
}

function MarginArtboard() {
  const items = [
    { label: "Flights", amount: "$821.60" },
    { label: "Lodging", amount: "$636.00" },
    { label: "Activities", amount: "$300.00" },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-dappled-paper p-5">
      <div className="w-full max-w-[240px] overflow-hidden rounded-2xl bg-white shadow-mw-lift">
        <div className="flex items-center justify-between border-b border-mw-border px-4 py-3">
          <span className="flex items-center text-base font-extrabold text-margin">
            Margin
            <span className="ml-[3px] h-[7px] w-[7px] bg-mw-primary" />
          </span>
          <span className="text-[8px] font-semibold text-mw-text-light">
            a Minor Works utility
          </span>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
            Costa Rica Trip
          </p>
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-1.5 font-semibold text-mw-text-dark">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-mw-primary text-[8px] text-white">
                  ✓
                </span>
                {item.label}
              </span>
              <span className="font-bold text-mw-text-dark">
                {item.amount}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between rounded-lg bg-mw-primary px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-wide text-white/70">
              Trip total
            </span>
            <span className="text-sm font-extrabold text-white">
              $1,757.60
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnceUponAPhotoArtboard() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#a45338] px-6 py-10 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-white font-serif text-lg italic text-white">
        O
      </span>
      <h3 className="font-serif text-2xl italic leading-snug text-white">
        Once Upon
        <br />a Photo
      </h3>
      <p className="text-xs italic leading-snug text-white/80">
        There&apos;s always more to the picture.
      </p>
    </div>
  );
}

type Project = {
  key: string;
  name: string;
  tagline: string;
  href: string;
  cta: string;
  Artboard: () => React.JSX.Element;
  logo?: string;
  status?: string;
};

const PROJECTS: Project[] = [
  {
    key: "dappled",
    name: "Dappled",
    tagline:
      "Dozens of little toys made from color, movement and sound. Touch, move, make, manipulate or just watch, listen and breathe.",
    href: "https://dappled.minorworks.co",
    cta: "Enter Dappled",
    Artboard: DappledArtboard,
    logo: "/logos/dappled-icon.png",
  },
  {
    key: "ballpark",
    name: "Ballpark",
    tagline:
      "A daily game about scale, estimation, and how surprisingly hard it is to know how big anything really is.",
    href: "https://playballpark.app",
    cta: "Play today's five",
    Artboard: BallparkArtboard,
    logo: "/logos/ballpark-logo.png",
  },
  {
    key: "venny",
    name: "Venny",
    tagline:
      "A calm daily word puzzle about convergence — finding the one answer that belongs at the center of it all.",
    href: "https://playvenny.app",
    cta: "Play today's Venny",
    Artboard: VennyArtboard,
    logo: "/logos/venny-logo.png",
  },
  {
    key: "unitedstats",
    name: "United Stats of America",
    tagline:
      "Real data on random, remarkable and ridiculous things—Bigfoot sightings, Waffle Houses, UFO reports and more—state by state.",
    href: "https://unitedstats.minorworks.co",
    cta: "Explore the data",
    Artboard: UnitedStatsArtboard,
    status: "In Beta",
  },
  {
    key: "throughline",
    name: "Throughline",
    tagline:
      "A shifting route puzzle about finding a way through. Turn the tiles, choose a direction, and help your ball find its way home.",
    href: "https://playthroughline.netlify.app",
    cta: "Play Throughline",
    Artboard: ThroughlineArtboard,
    status: "In Beta",
  },
  {
    key: "threestars",
    name: "Three Stars",
    tagline:
      "A trivia game for movie lovers! 1k movies, 100s of actors, awesome clues from arthouse to classic to recent hits!",
    href: "https://threestars.netlify.app",
    cta: "Play today's five",
    Artboard: ThreeStarsArtboard,
    status: "In Beta",
  },
  {
    key: "margin",
    name: "Margin",
    tagline:
      "A scratch calculator and ledger for Chrome. Collect numbers from around the web, keep each one tied to its source, and see what they add up to.",
    href: "https://chromewebstore.google.com/detail/margin/pancmfmghplcafdmbhnojncbjekkgjjm",
    cta: "Add to Chrome",
    Artboard: MarginArtboard,
    status: "In Beta",
  },
  {
    key: "onceuponaphoto",
    name: "Once Upon a Photo",
    tagline:
      "Once Upon a Photo reconnects old photographs and home movies to the people, places, and stories that time has obscured. A shared effort—shared on Instagram, gathered here as it grows.",
    href: "https://onceuponaphoto.minorworks.co",
    cta: "See what people added",
    Artboard: OnceUponAPhotoArtboard,
    status: "In Beta",
  },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative mb-10 md:mb-12">
      <hr className="border-t border-mw-border" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-mw-background px-4 text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        {label}
      </span>
    </div>
  );
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(({ key, name, tagline, href, cta, Artboard, logo }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <div className="px-[18px] pt-[18px]">
            <div className="relative h-[336px] w-full overflow-hidden rounded-mw-sm">
              <Artboard />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-6 p-6 md:p-7">
            <div>
              <div className="mb-2 flex items-center gap-2">
                {logo && (
                  <Image
                    src={logo}
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-md"
                  />
                )}
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
  );
}

export default function LiveProjects() {
  const flagship = PROJECTS.slice(0, 3);
  const beta = PROJECTS.slice(3);

  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <SectionDivider label="Live now" />
      <ProjectGrid projects={flagship} />

      <div className="mt-10 md:mt-12">
        <SectionDivider label="In Beta" />
        <ProjectGrid projects={beta} />
      </div>
    </section>
  );
}
