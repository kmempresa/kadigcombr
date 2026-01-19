import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import CarteiraDetailDrawer from "./CarteiraDetailDrawer";

interface Analyst {
  name: string;
  role?: string;
  avatarUrl: string;
}

interface Asset {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  pl?: number;
  evEbtida?: number;
  pvp?: number;
  logoUrl?: string;
  isNew?: boolean;
  isRemoved?: boolean;
}

export interface RecommendedPortfolio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  validUntil: string;
  rentabilidadeAnterior: number;
  rentabilidadeAcumulada: number;
  benchmark: string;
  benchmarkRentAnterior: number;
  benchmarkRentAcumulada: number;
  analysts: Analyst[];
  assets: Asset[];
  assetLogos: string[];
}

interface CarteirasRecomendadasDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for recommended portfolios
const mockPortfolios: RecommendedPortfolio[] = [
  {
    id: "dividendos",
    name: "Dividendos - Janeiro/26",
    description: "A carteira tem como objetivo a seleção das melhores empresas sob a ótica de geração total de valor ao acionista com foco na distribuição de proventos. Dessa forma, realizamos uma análise focada em ativ...",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: -1.60,
    rentabilidadeAcumulada: 126.60,
    benchmark: "IDIV",
    benchmarkRentAnterior: 1.50,
    benchmarkRentAcumulada: 87.60,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    assets: [
      { ticker: "ELET3", name: "CENTRAIS ELET BRAS S.A. - ELETROBRAS", sector: "OUTRO", weight: 10, logoUrl: "https://logo.clearbit.com/eletrobras.com" },
      { ticker: "CPLE3", name: "CIA PARANAENSE DE ENERGIA - COPEL", sector: "ENERGIA ELÉTRICA", weight: 10, logoUrl: "https://logo.clearbit.com/copel.com" },
      { ticker: "CYRE3", name: "CYRELA BRAZIL REALTY S.A.EMPREEND E PART", sector: "CONSTRUÇÃO CIVIL", weight: 10, logoUrl: "https://logo.clearbit.com/cyrela.com.br" },
      { ticker: "EQTL3", name: "EQUATORIAL S.A.", sector: "ENERGIA ELÉTRICA", weight: 10, logoUrl: "https://logo.clearbit.com/equatorialenergia.com.br" },
      { ticker: "ITUB4", name: "ITAU UNIBANCO HOLDING S.A.", sector: "INTERMEDIÁRIOS FINANCEIROS", weight: 10, logoUrl: "https://logo.clearbit.com/itau.com.br" },
      { ticker: "RENT3", name: "LOCALIZA RENT A CAR S.A.", sector: "DIVERSOS", weight: 10, logoUrl: "https://logo.clearbit.com/localiza.com" },
      { ticker: "ROXO34", name: "NUBANK", sector: "INTERMEDIÁRIOS FINANCEIROS", weight: 10 },
      { ticker: "RADL3", name: "RAIA DROGASIL S.A.", sector: "COMÉRCIO E DISTRIBUIÇÃO", weight: 10, logoUrl: "https://logo.clearbit.com/rd.com.br", isNew: true },
      { ticker: "RDOR3", name: "REDE D'OR SAO LUIZ S.A.", sector: "SERVIÇOS MÉDICO", weight: 10 },
      { ticker: "SAPR11", name: "CIA SANEAMENTO DO PARANA - SANEPAR", sector: "ÁGUA E SANEAMENTO", weight: 10, logoUrl: "https://logo.clearbit.com/sanepar.com.br", isNew: true },
    ],
    assetLogos: ["ITAU", "VALE", "PETR", "BBDC", "MGLU", "B3SA", "WEGE", "RENT", "JBSS", "ABEV"],
  },
  {
    id: "bdr",
    name: "BDR Janeiro/26",
    description: "A carteira de ações internacionais oferece oportunidades de investimento no exterior e é composta por BDRs. O processo de seleção dos BDRs é realizado pelo time de analistas e estrategistas com...",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 4.40,
    rentabilidadeAcumulada: 104.80,
    benchmark: "BDRX",
    benchmarkRentAnterior: 3.30,
    benchmarkRentAcumulada: 95.80,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
    ],
    assets: [],
    assetLogos: ["NVDA", "MSFT", "AAPL", "GOOG", "AMZN", "META", "TSLA", "V", "JPM", "UNH"],
  },
  {
    id: "fii",
    name: "FII - Janeiro/26",
    description: "Destinada aos investidores que gostariam de ter renda e ganho de capital, a Carteira Recomendada de Fundos Imobiliários tem como objetivo capturar as melhores oportunidades do mercado de FIIs após u...",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 2.74,
    rentabilidadeAcumulada: 63.54,
    benchmark: "IFIX",
    benchmarkRentAnterior: 3.14,
    benchmarkRentAcumulada: 43.76,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    assets: [],
    assetLogos: ["HGLG", "XPML", "KNRI", "VISC", "BTLG", "HFOF", "IRDM", "CPTS", "TGAR", "BRCO"],
  },
  {
    id: "etf",
    name: "ETF Strategy Janeiro/26",
    description: "O que é? O ETF Strategy é uma carteira de investimentos de fundos passivos listados em bolsa de valores (exchange-traded funds, ETF), compostas tanto por ETFs locais quanto BDR (Brazilian Deposit...",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 1.17,
    rentabilidadeAcumulada: 13.40,
    benchmark: "CDI",
    benchmarkRentAnterior: 1.16,
    benchmarkRentAcumulada: 16.20,
    analysts: [
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
    ],
    assets: [],
    assetLogos: ["BOVA", "IVVB", "SMAL", "DIVO", "HASH", "GOLD", "EURP", "XINA", "ACWI", "SPXI"],
  },
  {
    id: "esg",
    name: "ESG - Janeiro/2026",
    description: "O investimento responsável está se tornando cada vez mais importante para a comunidade de investidores em geral e para os investidores latino-americanos em particular. Com o objetivo de auxiliar nossos clientes em seu processo de investimento, lançamos um portfólio ESG. Será uma carteira de 10 ações, com revisão mensal.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: -6.50,
    rentabilidadeAcumulada: 8.10,
    benchmark: "S&P/B3",
    benchmarkRentAnterior: 1.60,
    benchmarkRentAcumulada: 8.40,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    assets: [
      { ticker: "ELET3", name: "CENTRAIS ELET BRAS S.A. - ELETROBRAS", sector: "OUTRO", weight: 10 },
      { ticker: "CPLE3", name: "CIA PARANAENSE DE ENERGIA - COPEL", sector: "ENERGIA ELÉTRICA", weight: 10 },
      { ticker: "CYRE3", name: "CYRELA BRAZIL REALTY S.A.", sector: "CONSTRUÇÃO CIVIL", weight: 10 },
      { ticker: "EQTL3", name: "EQUATORIAL S.A.", sector: "ENERGIA ELÉTRICA", weight: 10 },
      { ticker: "ITUB4", name: "ITAU UNIBANCO HOLDING S.A.", sector: "INTERMEDIÁRIOS FINANCEIROS", weight: 10 },
      { ticker: "RENT3", name: "LOCALIZA RENT A CAR S.A.", sector: "DIVERSOS", weight: 10 },
      { ticker: "ROXO34", name: "NUBANK", sector: "INTERMEDIÁRIOS FINANCEIROS", weight: 10 },
      { ticker: "RADL3", name: "RAIA DROGASIL S.A.", sector: "COMÉRCIO E DISTRIBUIÇÃO", weight: 10 },
      { ticker: "RDOR3", name: "REDE D'OR SAO LUIZ S.A.", sector: "SERVIÇOS MÉDICO", weight: 10 },
      { ticker: "SAPR11", name: "CIA SANEAMENTO DO PARANA - SANEPAR", sector: "ÁGUA E SANEAMENTO", weight: 10 },
    ],
    assetLogos: ["ITAU", "B3SA", "SUZB", "VALE", "WEGE", "ENBR", "EGIE", "TAEE", "CPFE", "EQTL"],
  },
  {
    id: "analise-tecnica",
    name: "Análise Técnica (Gráfica)",
    description: "A carteira tem como objetivo capturar as melhores oportunidades e performances do mercado de ações sugerindo uma carteira com até 10 ativos, com nova composição mensal. O processo de seleção dos ativo...",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 3.54,
    rentabilidadeAcumulada: 79.42,
    benchmark: "IBOV",
    benchmarkRentAnterior: 2.72,
    benchmarkRentAcumulada: 56.94,
    analysts: [
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    assets: [],
    assetLogos: ["FESA", "ALUP", "BEEF", "CEAB", "VAMO", "RADL", "SLCE", "CSNA", "SUZB", "VALE"],
  },
];

const CarteirasRecomendadasDrawer = ({ open, onOpenChange }: CarteirasRecomendadasDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState<RecommendedPortfolio | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredPortfolios = mockPortfolios.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = (portfolio: RecommendedPortfolio) => {
    setSelectedPortfolio(portfolio);
    setDetailOpen(true);
  };

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2).replace(".", ",");
    return value >= 0 ? `${formatted}%` : `-${formatted}%`;
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] bg-background">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2 text-foreground">
              <button onClick={() => onOpenChange(false)}>
                <span className="font-medium">Mercado</span>
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => onOpenChange(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {/* Hero Banner - Kadig Style */}
            <div className="relative h-72 bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(var(--kadig-navy))] to-primary/20 overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
              
              {/* Decorative lines */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              </div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 relative z-10">
                <h1 className="text-4xl font-bold text-primary glow-text mb-2">Carteiras</h1>
                <h2 className="text-3xl font-bold text-foreground mb-4">recomendadas</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Descubra Carteiras Recomendadas e Ativos que entraram e saíram do Radar
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 -mt-6 relative z-10">
              <div className="relative glass rounded-xl">
                <Input
                  placeholder="Buscar ativos, índices, fundos de investim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 bg-transparent border-0 text-foreground placeholder:text-muted-foreground pr-12"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Últimas carteiras */}
            <section className="p-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-lg font-semibold text-foreground">Últimas carteiras</h2>
              </div>

              <div className="space-y-4">
                {filteredPortfolios.map((portfolio, index) => (
                  <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-2xl overflow-hidden"
                  >
                    {/* Card Header with gradient - Kadig style */}
                    <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(var(--kadig-navy))] to-primary/30 p-4 flex items-end overflow-hidden">
                      {/* Decorative glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                      
                      {/* Decorative lines */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground relative z-10">{portfolio.name}</h3>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {portfolio.description}
                      </p>

                      {/* Asset logos */}
                      <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hide">
                        <div className="flex -space-x-1">
                          {portfolio.assetLogos.slice(0, 10).map((logo, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-card border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground overflow-hidden"
                            >
                              {logo.slice(0, 4)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rentabilidade */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1 h-4 bg-primary rounded-full" />
                          <span className="text-foreground font-medium">Rentabilidade</span>
                        </div>
                        <div className="space-y-1 pl-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3 bg-primary/60 rounded-full" />
                              <span className="text-muted-foreground text-sm">Rentabilidade Anterior</span>
                            </div>
                            <span className={`font-medium ${portfolio.rentabilidadeAnterior >= 0 ? "text-success" : "text-destructive"}`}>
                              {formatPercent(portfolio.rentabilidadeAnterior)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3 bg-accent rounded-full" />
                              <span className="text-muted-foreground text-sm">Rentabilidade Acumulada</span>
                            </div>
                            <span className={`font-medium ${portfolio.rentabilidadeAcumulada >= 0 ? "text-success" : "text-destructive"}`}>
                              {formatPercent(portfolio.rentabilidadeAcumulada)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Benchmark */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1 h-4 bg-primary rounded-full" />
                          <span className="text-foreground font-medium">Benchmark</span>
                          <span className="text-muted-foreground text-sm ml-auto">{portfolio.benchmark}</span>
                        </div>
                        <div className="space-y-1 pl-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3 bg-primary/60 rounded-full" />
                              <span className="text-muted-foreground text-sm">Rentabilidade Anterior</span>
                            </div>
                            <span className={`font-medium ${portfolio.benchmarkRentAnterior >= 0 ? "text-success" : "text-destructive"}`}>
                              {formatPercent(portfolio.benchmarkRentAnterior)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3 bg-accent rounded-full" />
                              <span className="text-muted-foreground text-sm">Rentabilidade Acumulada</span>
                            </div>
                            <span className={`font-medium ${portfolio.benchmarkRentAcumulada >= 0 ? "text-success" : "text-destructive"}`}>
                              {formatPercent(portfolio.benchmarkRentAcumulada)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ver Carteira Button - Kadig accent */}
                      <button
                        onClick={() => handleOpenDetail(portfolio)}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-3 rounded-xl flex items-center justify-between px-4 transition-colors"
                      >
                        <span>Ver Carteira</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Detail Drawer */}
      <CarteiraDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        portfolio={selectedPortfolio}
      />
    </>
  );
};

export default CarteirasRecomendadasDrawer;
