import Hero from "@/components/Hero";
import LiveProjects from "@/components/LiveProjects";
import Moments from "@/components/Moments";
import TrySomething from "@/components/TrySomething";
import ProjectCards from "@/components/ProjectCards";
import StudioNote from "@/components/StudioNote";
import Contact from "@/components/Contact";
import PassionProjects from "@/components/PassionProjects";
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
      <PassionProjects />
      <Footer />
    </main>
  );
}
