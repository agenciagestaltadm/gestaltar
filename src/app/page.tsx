import { Header, Footer } from "@/components/ui";
import { Hero, HowItWorks } from "@/components/home";

export default function Home() {
  return (
    <main className="min-h-screen bg-guestalt-black">
      <Header />
      <Hero />
      <HowItWorks />
      <Footer />
    </main>
  );
}
