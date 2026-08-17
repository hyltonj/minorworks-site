import Hero from "@/components/Hero";
import LiveProjects from "@/components/LiveProjects";
import Moments from "@/components/Moments";
import ProjectCards from "@/components/ProjectCards";
import StudioNote from "@/components/StudioNote";
import Contact from "@/components/Contact";
// PassionProjects ("Outside the Studio" — Little Free Herbary, The Thickening
// Plot) is built and ready in ./PassionProjects.tsx, just not rendered right
// now — felt like too big a tonal jump from the product-focused rest of the
// page. Re-add the import above and the <PassionProjects /> line below to
// bring it back.
import Footer from "@/components/Footer";
// TrySomething ("Try a little something" — Ballpark/Venny/Three Stars
// interactive teasers) is built and ready in ./TrySomething.tsx, just not
// rendered right now. Even after the Aug 2026 rebuild to match each game's
// real mechanics and visual design, it still doesn't capture what the
// actual games feel like well enough. Re-add the import above and the
// <TrySomething /> line below to bring it back.

export default function Home() {
  return (
    <main>
      <Hero />
      <LiveProjects />
      <ProjectCards />
      <StudioNote />
      <Contact />
      <Moments />
      {/* <PassionProjects /> */}
      <Footer />
    </main>
  );
}
