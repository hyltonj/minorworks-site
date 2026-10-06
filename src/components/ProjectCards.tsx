import Image from "next/image";

// Live games and tools have their own cards in LiveProjects. This section
// is for projects still taking shape: Dealemma, Sylly, the Winthrop Cipher,
// and Highlightr.

function DealemmaArt() {
  return (
    <div className="relative h-40 w-full bg-[#0f1b2e] sm:h-full">
      <Image
        src="/dealemma/box.jpg"
        alt="Dealemma box art — a party game about betting on what everyone else will do"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function SyllyArt() {
  return (
    <div className="flex h-40 items-center justify-center bg-mw-background">
      <div className="flex items-center text-2xl font-extrabold tracking-tight">
        <span className="animate-sylly-merge text-sylly">syl</span>
        <span className="animate-sylly-merge-right text-mw-primary">ly</span>
      </div>
    </div>
  );
}

function OnceUponAPhotoArtboard() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <Image
        src="/onceuponaphoto/chicago1941.jpg"
        alt="A crowd outside a Chicago church, April 1941 — one of the found photographs featured on Once Upon a Photo"
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#a45338] opacity-60 mix-blend-color" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/35" />
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
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
    </div>
  );
}

function HighlightrArt() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3 bg-mw-background">
      <div className="flex items-center text-2xl font-extrabold tracking-tight text-mw-text-dark">
        Highlightr
        <span className="ml-1 h-2 w-2 rounded-full bg-highlightr" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-mw-text-light">
        Coming soon
      </p>
    </div>
  );
}

export default function ProjectCards() {
  return (
    <section className="px-6 max-w-5xl mx-auto pb-14 md:pb-20">
      <div className="relative mb-10 md:mb-12">
        <hr className="border-t border-mw-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-mw-background px-4 text-xs font-bold uppercase tracking-widest text-mw-text-muted">
          More from the studio
        </span>
      </div>

      <div className="relative mb-8 mt-2">
        <hr className="border-t border-mw-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-mw-background px-4 text-xs font-bold uppercase tracking-widest text-mw-text-muted">
          In development
        </span>
      </div>

      <div className="mb-8 flex flex-col overflow-hidden rounded-mw border border-mw-border bg-white shadow-mw sm:flex-row sm:items-stretch">
        <div className="w-full sm:w-[220px]">
          <DealemmaArt />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2 p-6 text-center sm:text-left">
          <h3 className="text-lg font-bold text-mw-text-dark">Dealemma</h3>
          <p className="-mt-1 text-sm font-semibold text-mw-accent">
            A game about reading the room—and betting on what everyone else
            will do.
          </p>
          <p className="text-sm leading-relaxed text-mw-text-muted">
            Dealemma is a game about predicting people. Each round begins
            with an everyday situation, everyone secretly chooses what
            they&apos;d do, and then the market opens. Bluff, bargain, and
            second-guess your friends before discovering which choices were
            actually worth making.
          </p>
        </div>
      </div>

      <a
        href="https://winthropcipher.minorworks.co"
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
        <div className="absolute inset-0 bg-mw-accent opacity-70 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
        <div className="relative max-w-lg">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Massachusetts · 1630–2030
          </p>
          <h3 className="mb-3 font-serif text-3xl text-white sm:text-4xl">
            The Winthrop <span className="italic text-white">Cipher</span>
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-white/85">
            A historian, a dead archivist&apos;s papers, and a cipher hidden
            in four centuries of Massachusetts correspondence. Ten gold
            coins are already in the ground, buried by someone who wanted
            them found—eventually. Everything else you need is already in
            the letters, if you know how to read them.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white transition-transform group-hover:translate-x-0.5">
            Follow the investigation
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </a>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex h-full flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw">
          <SyllyArt />
          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">Sylly</h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              Sylly is a word game about taking language apart and
              discovering what else it wants to become. Split and swap
              syllables, uncover surprising connections, and find words
              hiding in plain sight.
            </p>
          </div>
        </div>

        <a
          href="https://onceuponaphoto.minorworks.co"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex h-full flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <div className="h-40">
            <OnceUponAPhotoArtboard />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              Once Upon a Photo
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              Once Upon a Photo reconnects old photographs and home movies
              to the people, places, and stories that time has obscured.
              A shared effort—shared on Instagram, gathered here as it grows.
            </p>
          </div>
        </a>

        <a
          href="https://highlightr.netlify.app"
          target="_blank"
          rel="noreferrer"
          className="mw-focus-ring group flex h-full flex-col overflow-hidden rounded-mw-sm border border-mw-border bg-white shadow-mw transition-shadow hover:shadow-mw-lift"
        >
          <HighlightrArt />
          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-1 text-sm font-bold text-mw-text-dark">
              Highlightr
            </h3>
            <p className="text-[13px] leading-relaxed text-mw-text-muted">
              Highlightr is a better memory for what you read. Save the
              exact passage that mattered, keep it connected to its source,
              and add a note or topic while the thought is still fresh.
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
