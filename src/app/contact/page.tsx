import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | Minor Works",
  description: "Write to Minor Works Studio in Boston. Questions, feedback or a hello are all welcome.",
  alternates: { canonical: "https://minorworks.co/contact/" },
};

export default function ContactPage() {
  return (
    <main>
      <section className="px-6 max-w-xl mx-auto py-16 md:py-24">
        <p className="mb-6 text-sm text-mw-text-muted">
          <a href="/" className="underline underline-offset-4">Minor Works</a>
        </p>
        <h1 className="mb-2 text-3xl font-semibold text-mw-text-dark md:text-4xl">Say hello</h1>
        <p className="mb-8 text-base text-mw-text-muted">
          Questions, feedback or just a hello. A real person in Boston reads every message.
        </p>
        <ContactForm />
      </section>
      <Footer />
    </main>
  );
}
