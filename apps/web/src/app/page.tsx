import { FAQ } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Navbar } from "@/components/marketing/navbar";
import { Platforms } from "@/components/marketing/platforms";
import { ValueProps } from "@/components/marketing/value-props";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ValueProps />
        <HowItWorks />
        <Features />
        <Platforms />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
