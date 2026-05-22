import Navbar from "./sections/navbar";
import { Hero } from "./sections/hero";
import { PainPoints } from "./sections/pain-points";
import { Features } from "./sections/features";
import { Workflow } from "./sections/workflow";
import { Preview } from "./sections/preview";
import { Footer } from "./sections/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <Features />
        <Workflow />
        <Preview />
      </main>
      <Footer />
    </>
  );
}
