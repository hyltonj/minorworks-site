import Hero from "@/components/Hero";
import LiveProjects from "@/components/LiveProjects";
import Moments from "@/components/Moments";
import TrySomething from "@/components/TrySomething";
import ProjectCards from "@/components/ProjectCards";
import StudioNote from "@/components/StudioNote";
import Contact from "@/components/Contact";
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
      <Footer />
    </main>
  );
}
