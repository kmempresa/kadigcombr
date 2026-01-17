import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DashboardPreview } from "@/components/DashboardPreview";
import { AIAgentSection } from "@/components/AIAgentSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { FloatingElements } from "@/components/FloatingElements";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <FloatingElements />
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <DashboardPreview />
        <AIAgentSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
