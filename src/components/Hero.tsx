export default function Hero() {
  return (
    <section className="px-6 pt-10 pb-6 md:pt-12 md:pb-8 max-w-6xl mx-auto text-center">
      <p className="mb-8 inline-flex items-baseline text-base md:text-[23px] font-bold uppercase tracking-[0.1em] text-mw-text-dark">
        Minor Works
        <span
          aria-hidden="true"
          className="ml-[2px] h-[5px] w-[5px] translate-y-[1px] rounded-full bg-mw-accent"
        />
      </p>
      <h1 className="mb-8 text-[clamp(1.75rem,1rem+2.3vw,3rem)] font-[460] leading-[1.1] text-mw-text-dark">
        thoughtful things for playful minds
      </h1>
      <p className="mx-auto max-w-[780px] text-[19px] md:text-[20px] font-normal leading-[1.55] text-mw-primary/75">
        Minor Works makes small games, quiet tools, and curious
        experiments—each built around one clear idea, with nothing designed
        to keep you longer than it should.
      </p>
    </section>
  );
}
