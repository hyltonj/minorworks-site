export default function Hero() {
  return (
    <section className="px-6 pt-14 pb-5 md:pt-20 md:pb-[26px] max-w-4xl mx-auto text-center">
      <p className="mb-[13px] inline-flex items-center gap-1.5 text-sm md:text-base font-extrabold uppercase tracking-widest text-mw-text-dark">
        Minor Works
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-mw-accent"
        />
      </p>
      <h1 className="text-lg md:text-2xl lg:text-[26px] font-medium leading-snug text-mw-text-dark">
        thoughtful things for playful minds
      </h1>
    </section>
  );
}
