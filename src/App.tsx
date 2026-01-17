import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import Index from "./pages/Index";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AppDashboard from "./pages/AppDashboard";
import ConsultorIA from "./pages/ConsultorIA";
import AdicionarInvestimento from "./pages/AdicionarInvestimento";
import AdicionarCarteira from "./pages/AdicionarCarteira";
import AdicionarAplicacao from "./pages/AdicionarAplicacao";
import AdicionarResgate from "./pages/AdicionarResgate";
import TransferirAtivo from "./pages/TransferirAtivo";
import ExcluirAtivos from "./pages/ExcluirAtivos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PortfolioProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/app" element={<AppDashboard />} />
            <Route path="/consultor-ia" element={<ConsultorIA />} />
            <Route path="/adicionar-investimento" element={<AdicionarInvestimento />} />
            <Route path="/adicionar-carteira" element={<AdicionarCarteira />} />
            <Route path="/adicionar-aplicacao" element={<AdicionarAplicacao />} />
            <Route path="/adicionar-resgate" element={<AdicionarResgate />} />
            <Route path="/transferir-ativo" element={<TransferirAtivo />} />
            <Route path="/excluir-ativos" element={<ExcluirAtivos />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PortfolioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
