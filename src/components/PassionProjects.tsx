import Image from "next/image";

// Real, personal, non-Minor-Works projects — a garden and a community herb
// box. Deliberately lighter-touch than the product cards above: plain text
// links instead of CTA buttons, photos instead of app screenshots.

function ThickeningPlotArt() {
  const photos = [
    { src: "/passion/tp/potting-bench.jpg", alt: "The Thickening Plot's built-in potting bench with sink and tool wall" },
    { src: "/passion/tp/chartreuse.jpg", alt: "Chartreuse Hakone grass and a red Japanese maple along the front path" },
    { src: "/passion/tp/winter.jpg", alt: "The garden path under snow, string lights lit at night" },
    { src: "/passion/tp/ai-garden.jpg", alt: "Over 200 plant tags laid out before being catalogued with AI" },
  ];
  return (
    <div className="grid h-full w-full grid-cols-2 gap-[3px] bg-mw-border">
      {photos.map((p) => (
        <div key={p.src} className="relative">
          <Image
            src={p.src}
            alt={p.alt}
            fill
            sizes="(min-width: 640px) 110px, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function LittleFreeHerbaryArt() {
  const photos = [
    { src: "/passion/lfh/hero-herbs.jpg", alt: "A freshly cut bundle of dill, lemon balm, chives, and thyme" },
    { src: "/passion/lfh/about-1.jpg", alt: "A planted Little Free Herbary box labeled Charter #1, feel free to take some" },
  ];
  return (
    <div className="grid h-full w-full grid-cols-2 gap-[3px] bg-mw-border">
      {photos.map((p) => (
        <div key={p.src} className="relative">
          <Image
            src={p.src}
            alt={p.alt}
            fill
            sizes="(min-width: 640px) 220px, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export default function PassionProjects() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-mw-text-muted">
          Outside the studio
        </h2>
        <p className="mx-auto max-w-md text-sm text-mw-text-muted">
          Games and tools are what we make. These are a few other things we
          love and can&apos;t stop tinkering with.
        </p>
      </div>

      <a
        href="https://www.instagram.com/thethickeningplot"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group mb-6 flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift sm:flex-row sm:items-stretch"
      >
        <div className="h-[220px] w-full sm:h-auto sm:w-[280px]">
          <ThickeningPlotArt />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-mw-text-dark">
            The Thickening Plot
          </h3>
          <p className="text-sm leading-relaxed text-mw-text-muted">
            A home garden in Jamaica Plain, Boston, that's slowly taken over
            every inch of usable space — 155+ plants, a custom potting
            station, and a City of Boston award for 3rd-best large garden.
            Same instincts as the studio: a lot of small, deliberate
            decisions, made over a long time.
          </p>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-mw-accent">
            Follow @thethickeningplot
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </div>
      </a>

      <a
        href="https://littlefreeherbary.org"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift sm:flex-row sm:items-stretch"
      >
        <div className="h-[220px] w-full sm:h-auto sm:w-[280px]">
          <LittleFreeHerbaryArt />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-mw-text-dark">
            Little Free Herbary
          </h3>
          <p className="text-sm leading-relaxed text-mw-text-muted">
            A community sharing movement, inspired by the Little Free
            Library — free herbs, freely shared, one shared garden box at a
            time. Plant one, take a sprig, or just say hi to a neighbor.
          </p>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-mw-accent">
            Visit Little Free Herbary
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </div>
      </a>
    </section>
  );
}
