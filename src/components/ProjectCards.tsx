import Image from "next/image";

// Ballpark, Venny, and Dappled have their own prominent cards in
// LiveProjects — this section is everything else: a real but secondary
// project (Rank and File), and what's still taking shape.
//
// Sylly has no real visual identity yet — the teaser art below is
// intentionally restrained and invented (word fragments), not a claim
// about what the real product will look like. Throughline uses its
// actual puzzle board art.

function RankAndFileArt() {
  const rows = ["Thriller", "Hotel California", "21", "Back in Black"];
  return (
    <div className="flex h-full min-h-[140px] w-full items-center justify-center bg-mw-primary p-4">
      <div className="w-full max-w-[170px] rounded-xl bg-mw-background p-3 shadow-mw-lift">
        <p className="mb-2 rounded-md bg-[#F3F4F6] py-1 text-center text-[8px] font-extrabold uppercase tracking-wider text-[#152B4D]">
          Rank and File
        </p>
        <p className="text-center text-[10px] font-extrabold text-mw-accent">
          Albums sold
        </p>
        <p className="mb-2 text-center text-[7px] italic text-mw-text-light">
          Most → Least
        </p>
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div
              key={r}
              className="truncate rounded-md border border-mw-border bg-white px-1.5 py-1 text-center text-[7px] font-semibold text-mw-text-dark"
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QRTipsheetArt() {
  return (
    <div className="flex h-full min-h-[140px] w-full items-center justify-center bg-[#1b3a5c] p-4">
      <div className="w-full max-w-[190px] rounded-xl bg-[#eef2f7] p-3 shadow-mw-lift">
        <Image
          src="/qrtipsheet/wordmark.svg"
          alt="QR Tipsheet"
          width={440}
          height={110}
          className="mx-auto mb-3 h-auto w-[160px]"
        />
        <div className="flex justify-center gap-2">
          <div className="relative h-[92px] w-[86px] overflow-hidden rounded-lg border border-mw-border bg-white shadow-sm">
            <Image
              src="/qrtipsheet/card1.png"
              alt="Family Calendar QR card"
              fill
              sizes="86px"
              className="object-cover object-top"
            />
          </div>
          <div className="relative h-[92px] w-[86px] overflow-hidden rounded-lg border border-mw-border bg-white shadow-sm">
            <Image
              src="/qrtipsheet/card2.png"
              alt="Weekend Playlist QR card"
              fill
              sizes="86px"
              className="object-cover object-top"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitedStatsArt() {
  return (
    <div className="relative h-40 w-full bg-dappled-paper">
      <Image
        src="/screenshots/united2_cropped.png"
        alt="United Stats of America — a state-by-state data explorer for offbeat subjects like Bigfoot sightings and Waffle Houses"
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}

function DealemmaArt() {
  return (
    <div className="relative h-40 w-full bg-[#0f1b2e]">
      <Image
        src="/dealemma/box.jpg"
        alt="Dealemma box art — a card and chip game about betting on what everyone else will do"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function SyllyArt() {
  return (
    <div className="flex h-32 items-center justify-center bg-mw-background">
      <div className="flex items-center text-2xl font-extrabold tracking-tight">
        <span className="animate-sylly-merge text-sylly">syl</span>
        <span className="animate-sylly-merge-right text-mw-primary">ly</span>
      </div>
    </div>
  );
}

function ThroughlineArt() {
  return (
    <div className="relative h-40 w-full bg-[#647992]">
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

export default function ProjectCards() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-mw-text-muted">
        More from the studio
      </h2>

      <div className="mb-8 flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw sm:flex-row sm:items-stretch">
        <div className="w-full sm:w-[220px]">
          <RankAndFileArt />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <h3 className="text-lg font-bold text-mw-text-dark">
            Rank and File
          </h3>
          <p className="max-w-md text-base leading-relaxed text-mw-text-muted">
            Everything has its place, though rarely quite where you think it
            does. Rank five familiar things from most to least, longest to
            shortest or earliest to latest—and see how the world compares
            with the one in your head.
          </p>
        </div>
        <a
          href="https://playballpark.app/rank"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex w-full shrink-0 items-center justify-center bg-mw-primary p-6 transition-colors hover:bg-mw-primary/90 sm:w-[160px]"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-mw-primary transition-transform group-hover:translate-x-0.5">
            Play
            <span aria-hidden="true">→</span>
          </span>
        </a>
      </div>

      <a
        href="https://qrtipsheet.netlify.app"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group mb-8 flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift sm:flex-row sm:items-stretch"
      >
        <div className="w-full sm:w-[220px]">
          <QRTipsheetArt />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <h3 className="text-lg font-bold text-mw-text-dark">
            QR Tipsheet
          </h3>
          <p className="max-w-md text-base leading-relaxed text-mw-text-muted">
            A printable homepage for your fridge or bulletin board — QR
            codes for the links you&apos;re always digging for: the
            calendar, the WiFi, the team schedule, the playlist.
            Customizable with suggested links for local teams, schools, and
            community resources, or build your own from a blank sheet.
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-center bg-mw-accent p-6 transition-colors group-hover:bg-mw-accent/90 sm:w-[160px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-mw-accent transition-transform group-hover:translate-x-0.5">
            Open
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </a>

      <a
        href="https://winthropcipher.netlify.app"
        target="_blank"
        rel="noreferrer"
        className="mw-focus-ring group relative mb-8 flex flex-col items-center overflow-hidden rounded-mw border border-mw-border px-6 py-14 text-center shadow-mw transition-shadow hover:shadow-mw-lift sm:py-20"
      >
        <Image
          src="/winthrop/map_light.png"
          alt="A seventeenth-century map of the Massachusetts coastline"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative max-w-lg">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a961]">
            Massachusetts · 1630–2030
          </p>
          <h3 className="mb-3 font-serif text-3xl text-white sm:text-4xl">
            The Winthrop <span className="italic text-[#c9a961]">Cipher</span>
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-white/85">
            A historian, a dead archivist&apos;s papers, and a cipher hidden
            in four centuries of Massachusetts correspondence. Ten gold
            coins are already in the ground. Everything else is in the
            letters.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#c9a961] transition-transform group-hover:translate-x-0.5">
            Follow the investigation
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </a>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="https://unitedstats.minorworks.co"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <UnitedStatsArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              United Stats of America
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              Real data on random, remarkable and ridiculous things—Bigfoot
              sightings, Waffle Houses, UFO reports and more—state by
              state.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-accent">
              Launching soon
            </p>
          </div>
        </a>

        <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <DealemmaArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              Dealemma
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              A tabletop game about reading the room—and betting on what
              everyone else will do.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
              In development
            </p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <SyllyArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">Sylly</h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              Words come apart. Their pieces find new places to belong.
              Still finding its own shape.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
              In development
            </p>
          </div>
        </div>

        <a
          href="https://playthroughline.netlify.app"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <ThroughlineArt />
          <div className="p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              Throughline
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              Throughline is a shifting route puzzle about finding a way
              through. Turn the tiles, choose a direction, and help your
              ball find its way home.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-mw-text-muted">
              In development
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
