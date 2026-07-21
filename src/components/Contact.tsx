export default function Contact() {
  return (
    <section className="px-6 max-w-xl mx-auto pb-20 md:pb-28 text-center">
      <h2 className="mb-2 text-lg font-semibold text-mw-text-dark">
        Say hello
      </h2>
      <p className="mb-6 text-sm text-mw-text-muted">
        Questions, feedback, or just want to say the estimation game ruined
        your afternoon?
      </p>
      <a
        href="mailto:hyltonj@gmail.com"
        className="mw-focus-ring inline-flex rounded-mw-sm bg-mw-primary px-6 py-3 text-sm font-bold tracking-wide text-white"
      >
        Get in touch
      </a>
    </section>
  );
}
