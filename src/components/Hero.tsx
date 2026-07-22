export default function Hero() {
  return (
    <section className="px-6 pt-12 pb-12 md:pt-16 md:pb-[70px] max-w-6xl mx-auto text-center">
      <p className="mb-8 inline-flex items-center gap-1 text-base md:text-[23px] font-bold uppercase tracking-[0.1em] text-mw-text-dark">
        Minor Works
        <span
          aria-hidden="true"
          className="h-[5px] w-[5px] rounded-full bg-mw-accent"
        />
      </p>
      <h1 className="mb-10 text-[clamp(1.875rem,1rem+3vw,3.375rem)] font-medium leading-[1.12] text-mw-text-dark">
        thoughtful things for playful minds
      </h1>
      <p className="mx-auto max-w-[800px] text-[19px] md:text-[21px] font-normal leading-[1.55] text-mw-text-muted">
        Minor Works makes small games, quiet tools, and curious
        experiments—each built around one clear idea, with nothing designed
        to keep you longer than it should.
      </p>
    </section>
  );
}
