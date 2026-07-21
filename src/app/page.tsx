import Hero from "@/components/Hero";
import Philosophy from "@/components/Philosophy";
import LiveProjects from "@/components/LiveProjects";
import Moments from "@/components/Moments";
import TrySomething from "@/components/TrySomething";
import ProjectCards from "@/components/ProjectCards";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Philosophy />
      <LiveProjects />
      <Moments />
      <TrySomething />
      <ProjectCards />
      <Contact />
      <Footer />
    </main>
  );
}
