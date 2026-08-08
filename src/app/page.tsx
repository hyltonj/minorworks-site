import Hero from "@/components/Hero";
import LiveProjects from "@/components/LiveProjects";
import Moments from "@/components/Moments";
import TrySomething from "@/components/TrySomething";
import ProjectCards from "@/components/ProjectCards";
import StudioNote from "@/components/StudioNote";
import Contact from "@/components/Contact";
// PassionProjects ("Outside the Studio" — Little Free Herbary, The Thickening
// Plot) is built and ready in ./PassionProjects.tsx, just not rendered right
// now — felt like too big a tonal jump from the product-focused rest of the
// page. Re-add the import above and the <PassionProjects /> line below to
// bring it back.
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <LiveProjects />
      <TrySomething />
      <ProjectCards />
      <StudioNote />
      <Contact />
      <Moments />
      {/* <PassionProjects /> */}
      <Footer />
    </main>
  );
}
