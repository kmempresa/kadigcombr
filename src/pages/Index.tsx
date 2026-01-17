import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DashboardPreview } from "@/components/DashboardPreview";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <DashboardPreview />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
