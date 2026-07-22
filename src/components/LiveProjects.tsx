import Image from "next/image";

// Asymmetrical "studio shelf" composition: Ballpark is the featured project
// (a landscape card built from a purpose-made, tightly cropped mockup of
// the real question/slider/submit interaction), with Venny and Dappled
// stacked beside it as two smaller cards using real, tightly cropped
// screenshots framed with deliberate breathing room at the top.

function BallparkGraphic() {
  return (
    <div className="flex h-full w-full flex-col bg-mw-primary">
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
        <span className="text-[11px] font-extrabold tracking-tight text-white">
          BALLPARK
        </span>
        <span className="text-[9px] font-semibold text-white/60">
          More ▾
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-5 bg-mw-background px-6 py-6 sm:px-9">
        <p className="text-base font-bold leading-snug text-mw-primary sm:text-lg">
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
          <p className="text-xs font-semibold text-mw-text-muted">
            Somewhere in here.
          </p>
          <div className="rounded-full bg-mw-primary px-5 py-2 text-xs font-bold text-white">
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
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
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
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

function FeaturedCard() {
  return (
    <a
      href="https://playballpark.app"
      target="_blank"
      rel="noreferrer"
      className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
    >
      <div className="aspect-[16/9] w-full">
        <BallparkGraphic />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="mb-2 flex items-center gap-2">
          <Image
            src="/logos/ballpark-logo.png"
            alt=""
            width={22}
            height={22}
            className="rounded-md"
          />
          <h3 className="text-base font-bold text-mw-text-dark">Ballpark</h3>
        </div>
        <p className="mb-4 text-[13px] leading-relaxed text-mw-text-muted">
          A daily game about scale, estimation, and how surprisingly hard it
          is to know how big anything really is.
        </p>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-mw-accent">
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
  );
}

function SmallCard({
  href,
  name,
  tagline,
  cta,
  logo,
  Art,
}: {
  href: string;
  name: string;
  tagline: string;
  cta: string;
  logo: string;
  Art: () => React.JSX.Element;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mw-focus-ring group flex flex-1 overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
    >
      <div className="relative w-[38%] shrink-0 sm:w-2/5">
        <Art />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-4 sm:p-5">
        <div className="flex items-center gap-1.5">
          <Image
            src={logo}
            alt=""
            width={16}
            height={16}
            className="rounded"
          />
          <h3 className="text-[13px] font-bold text-mw-text-dark">{name}</h3>
        </div>
        <p className="text-[12px] leading-snug text-mw-text-muted">
          {tagline}
        </p>
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-mw-accent">
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
  );
}

export default function LiveProjects() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        Live now
      </h2>
      <div className="grid gap-5 lg:grid-cols-[5fr_3fr] lg:items-stretch">
        <FeaturedCard />
        <div className="flex flex-col gap-5 md:flex-row lg:flex-col">
          <SmallCard
            href="https://playvenny.app"
            name="Venny"
            tagline="A daily puzzle about what belongs together — and what sits in between."
            cta="Play today's Venny"
            logo="/logos/venny-logo.png"
            Art={VennyGraphic}
          />
          <SmallCard
            href="https://dappled.minorworks.co"
            name="Dappled"
            tagline="Dozens of quiet toys made from color, movement, and sound. Touch, make, focus, or just watch."
            cta="Enter Dappled"
            logo="/logos/dappled-icon.png"
            Art={DappledGraphic}
          />
        </div>
      </div>
    </section>
  );
}
