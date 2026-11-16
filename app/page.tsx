import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/homepage/Hero";
import { Features } from "@/components/homepage/Features";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomCursor />
      <Navbar />
      <main className="flex-1 w-full">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
