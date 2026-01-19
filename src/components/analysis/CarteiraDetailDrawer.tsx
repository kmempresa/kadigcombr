import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Download,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { useTheme } from "@/hooks/useTheme";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CarteiraDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string | null;
}

interface Asset {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  logoUrl: string | null;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  pl: number | null;
  evEbtida: number | null;
  pvp: number | null;
  dividendYield: number | null;
  roe: number | null;
  marginEbit: number | null;
  isNew: boolean;
  isRemoved: boolean;
}

interface PortfolioDetail {
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
  analysts: { name: string; avatarUrl: string }[];
  assets: Asset[];
  removedAssets: Asset[];
  newAssets: Asset[];
  sectorDistribution: { name: string; value: number }[];
  assetDistribution: { name: string; value: number }[];
  lastUpdate: string;
}

// Kadig color palette for charts
const COLORS = [
  "hsl(210, 100%, 60%)", // primary blue
  "hsl(185, 80%, 55%)",  // cyan/accent
  "hsl(220, 65%, 25%)",  // navy
  "hsl(210, 100%, 75%)", // light blue
  "hsl(220, 55%, 35%)",  // lighter navy
  "hsl(210, 100%, 50%)", // darker blue
  "hsl(185, 80%, 45%)",  // darker cyan
  "hsl(220, 50%, 45%)",  // muted blue
  "hsl(210, 80%, 65%)",  // soft blue
  "hsl(185, 60%, 60%)",  // soft cyan
];

const CarteiraDetailDrawer = ({ open, onOpenChange, portfolioId }: CarteiraDetailDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchPortfolioDetail = async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching portfolio detail for ${portfolioId}...`);
      const { data, error } = await supabase.functions.invoke('recommended-portfolios', {
        body: { type: 'detail', portfolioId }
      });

      if (error) throw error;

      if (data) {
        console.log(`Loaded portfolio with ${data.assets?.length || 0} assets`);
        setPortfolio(data);
      }
    } catch (error) {
      console.error("Error fetching portfolio detail:", error);
      toast.error("Erro ao carregar carteira");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && portfolioId) {
      fetchPortfolioDetail();
    }
  }, [open, portfolioId]);

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2).replace(".", ",");
    return value >= 0 ? `${formatted}%` : `-${formatted}%`;
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return value.toFixed(2).replace(".", ",");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDownloadPDF = async () => {
    if (!portfolio || !contentRef.current) return;

    setDownloadingPdf(true);
    toast.info("Gerando PDF...");

    try {
      // Wait for all images to load
      const images = contentRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // Create PDF with Kadig branding
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header with Kadig branding - dark blue gradient simulation
      pdf.setFillColor(15, 23, 42); // Kadig deep color
      pdf.rect(0, 0, pageWidth, 60, 'F');
      
      // Accent line
      pdf.setFillColor(0, 212, 255); // Kadig accent cyan
      pdf.rect(0, 55, pageWidth, 2, 'F');

      // Logo text (Kadig)
      pdf.setTextColor(0, 212, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KADIG', margin, 25);

      // Portfolio name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text(portfolio.name, margin, 42);

      // Date info
      pdf.setFontSize(10);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Válida até: ${portfolio.validUntil}`, margin, 52);

      yPos = 70;

      // Description section
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(portfolio.description, pageWidth - margin * 2);
      pdf.text(descLines, margin, yPos);
      yPos += descLines.length * 5 + 10;

      // Rentabilidade section
      pdf.setFillColor(240, 240, 245);
      pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Rentabilidade Teórica', margin + 5, yPos + 8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      // Rentabilidade Anterior
      pdf.setTextColor(100, 100, 100);
      pdf.text('Rentabilidade Anterior:', margin + 5, yPos + 18);
      const rentAnteriorColor = portfolio.rentabilidadeAnterior >= 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(rentAnteriorColor[0], rentAnteriorColor[1], rentAnteriorColor[2]);
      pdf.text(formatPercent(portfolio.rentabilidadeAnterior), margin + 60, yPos + 18);

      // Rentabilidade Acumulada
      pdf.setTextColor(100, 100, 100);
      pdf.text('Rentabilidade Acumulada:', margin + 5, yPos + 28);
      const rentAcumColor = portfolio.rentabilidadeAcumulada >= 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(rentAcumColor[0], rentAcumColor[1], rentAcumColor[2]);
      pdf.text(formatPercent(portfolio.rentabilidadeAcumulada), margin + 62, yPos + 28);

      yPos += 45;

      // Benchmark section
      pdf.setFillColor(240, 240, 245);
      pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Benchmark: ${portfolio.benchmark}`, margin + 5, yPos + 8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      pdf.setTextColor(100, 100, 100);
      pdf.text('Rentabilidade Anterior:', margin + 5, yPos + 18);
      const benchAnteriorColor = portfolio.benchmarkRentAnterior >= 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(benchAnteriorColor[0], benchAnteriorColor[1], benchAnteriorColor[2]);
      pdf.text(formatPercent(portfolio.benchmarkRentAnterior), margin + 60, yPos + 18);

      pdf.setTextColor(100, 100, 100);
      pdf.text('Rentabilidade Acumulada:', margin + 5, yPos + 28);
      const benchAcumColor = portfolio.benchmarkRentAcumulada >= 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(benchAcumColor[0], benchAcumColor[1], benchAcumColor[2]);
      pdf.text(formatPercent(portfolio.benchmarkRentAcumulada), margin + 62, yPos + 28);

      yPos += 45;

      // Composição da carteira title
      pdf.setFillColor(0, 212, 255);
      pdf.rect(margin, yPos, 3, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Composição da Carteira', margin + 7, yPos + 6);
      yPos += 15;

      // Assets table header
      const colWidths = [30, 55, 20, 22, 22, 22];
      const headers = ['Ticker', 'Setor', 'Peso', 'P/L', 'EV/EBTIDA', 'P/VP'];
      
      pdf.setFillColor(15, 23, 42);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      
      let xPos = margin + 2;
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos + 5.5);
        xPos += colWidths[i];
      });
      
      yPos += 10;

      // Assets rows
      pdf.setFont('helvetica', 'normal');
      portfolio.assets.forEach((asset, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        const bgColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

        pdf.setTextColor(30, 30, 30);
        
        xPos = margin + 2;
        
        // Ticker with status indicator
        let tickerText = asset.ticker;
        if (asset.isNew) {
          pdf.setTextColor(34, 197, 94);
          tickerText = `↓ ${asset.ticker}`;
        }
        pdf.text(tickerText, xPos, yPos + 5.5);
        pdf.setTextColor(30, 30, 30);
        xPos += colWidths[0];
        
        // Sector (truncate if needed)
        const sectorText = asset.sector.length > 18 ? asset.sector.substring(0, 16) + '...' : asset.sector;
        pdf.text(sectorText, xPos, yPos + 5.5);
        xPos += colWidths[1];
        
        // Weight
        pdf.text(`${asset.weight.toFixed(1)}%`, xPos, yPos + 5.5);
        xPos += colWidths[2];
        
        // P/L
        pdf.text(formatNumber(asset.pl), xPos, yPos + 5.5);
        xPos += colWidths[3];
        
        // EV/EBTIDA
        pdf.text(formatNumber(asset.evEbtida), xPos, yPos + 5.5);
        xPos += colWidths[4];
        
        // P/VP
        pdf.text(formatNumber(asset.pvp), xPos, yPos + 5.5);
        
        yPos += 8;
      });

      // Removed assets section if any
      if (portfolio.removedAssets && portfolio.removedAssets.length > 0) {
        yPos += 10;
        
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFillColor(239, 68, 68);
        pdf.rect(margin, yPos, 3, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(239, 68, 68);
        pdf.text('Ativos que Saíram', margin + 7, yPos + 6);
        yPos += 12;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        
        portfolio.removedAssets.forEach((asset) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(`↑ ${asset.ticker} - ${asset.name}`, margin + 5, yPos);
          yPos += 6;
        });
      }

      // New assets section if any
      if (portfolio.newAssets && portfolio.newAssets.length > 0) {
        yPos += 10;
        
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFillColor(34, 197, 94);
        pdf.rect(margin, yPos, 3, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(34, 197, 94);
        pdf.text('Ativos que Entraram', margin + 7, yPos + 6);
        yPos += 12;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        
        portfolio.newAssets.forEach((asset) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(`↓ ${asset.ticker} - ${asset.name}`, margin + 5, yPos);
          yPos += 6;
        });
      }

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);
        pdf.text(`Gerado por KADIG • ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 6);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 6);
      }

      // Save PDF
      const fileName = `Carteira_${portfolio.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!portfolioId) return null;

  return (
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

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando carteira...</p>
          </div>
        ) : portfolio ? (
          <div className="flex-1 overflow-y-auto" ref={contentRef}>
            {/* Hero Section - Kadig Style */}
            <div className="relative bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(var(--kadig-navy))] to-primary/20 p-6 overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              
              {/* Decorative lines */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              </div>

              <div className="relative z-10">
                <button 
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground text-sm mb-6 underline hover:text-foreground transition-colors"
                >
                  Voltar
                </button>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Essa é a carteira recomendada de
                </h1>
                <h2 className="text-3xl font-bold text-accent glow-text mb-4">
                  {portfolio.name}
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  Criada em: {portfolio.createdAt} • Válida até: {portfolio.validUntil}
                </p>
                {portfolio.lastUpdate && (
                  <p className="text-muted-foreground/60 text-xs mb-4">
                    Dados atualizados: {new Date(portfolio.lastUpdate).toLocaleString('pt-BR')}
                  </p>
                )}
                <p className="text-muted-foreground text-sm mb-6">
                  {portfolio.description}
                </p>

                {/* Analysts */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {portfolio.analysts?.map((analyst, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <img
                        src={analyst.avatarUrl}
                        alt={analyst.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
                      />
                      <span className="text-foreground text-sm">{analyst.name}</span>
                    </div>
                  ))}
                </div>

                {/* Download Button */}
                <button 
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="glass hover:bg-card/80 text-foreground font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span>{downloadingPdf ? 'Gerando PDF...' : 'Baixar Carteira'}</span>
                </button>
              </div>
            </div>

            {/* Rentabilidade teórica */}
            <section className="p-4">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-foreground font-semibold">Rentabilidade teórica</h3>
                </div>
                <div className="h-px bg-border mb-4" />
                
                <div className="space-y-2">
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
            </section>

            {/* Benchmark */}
            <section className="px-4 pb-4">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-foreground font-semibold">Benchmark</h3>
                  </div>
                  <span className="text-muted-foreground">{portfolio.benchmark}</span>
                </div>
                <div className="h-px bg-border mb-4" />
                
                <div className="space-y-2">
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
            </section>

            {/* Distribuição por ativo */}
            {portfolio.assetDistribution && portfolio.assetDistribution.length > 0 && (
              <section className="px-4 pb-4">
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-foreground font-semibold">Distribuição por ativo</h3>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolio.assetDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          {portfolio.assetDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {portfolio.assetDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-1 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground text-xs">
                          {item.value.toFixed(0)}% - {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Distribuição por setor */}
            {portfolio.sectorDistribution && portfolio.sectorDistribution.length > 0 && (
              <section className="px-4 pb-4">
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-foreground font-semibold">Distribuição por setor</h3>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolio.sectorDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          {portfolio.sectorDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {portfolio.sectorDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-1 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground text-sm truncate">
                          {item.value.toFixed(0)}% - {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Composição da carteira */}
            {portfolio.assets && portfolio.assets.length > 0 && (
              <section className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-foreground font-semibold">Composição da carteira</h3>
                </div>

                <div className="space-y-3">
                  {portfolio.assets.map((asset, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {asset.logoUrl ? (
                            <img 
                              src={asset.logoUrl} 
                              alt={asset.ticker}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium text-sm truncate pr-2">{asset.name}</p>
                            {asset.isNew && (
                              <ArrowDown className="w-5 h-5 text-success flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                              {asset.ticker}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                              {asset.sector}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price info */}
                      {asset.regularMarketPrice > 0 && (
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
                          <span className="text-foreground font-semibold">
                            {formatCurrency(asset.regularMarketPrice)}
                          </span>
                          <span className={`text-sm font-medium ${asset.regularMarketChangePercent >= 0 ? "text-success" : "text-destructive"}`}>
                            {asset.regularMarketChangePercent >= 0 ? "+" : ""}{asset.regularMarketChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Peso:</span>
                          <span className="text-foreground font-medium">{asset.weight.toFixed(2).replace(".", ",")}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/L (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EV/EBTIDA</span>
                          <span className="text-foreground">{formatNumber(asset.evEbtida)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/VP</span>
                          <span className="text-foreground">{formatNumber(asset.pvp)}</span>
                        </div>
                        {asset.dividendYield !== null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Div. Yield</span>
                            <span className="text-foreground">{formatNumber(asset.dividendYield)}%</span>
                          </div>
                        )}
                        {asset.roe !== null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ROE</span>
                            <span className="text-foreground">{formatNumber(asset.roe)}%</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Ativos que saíram da carteira */}
            {portfolio.removedAssets && portfolio.removedAssets.length > 0 && (
              <section className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-destructive rounded-full" />
                  <h3 className="text-foreground font-semibold">Ativos que saíram da carteira</h3>
                </div>

                <div className="space-y-3">
                  {portfolio.removedAssets.map((asset, index) => (
                    <div key={index} className="glass rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {asset.logoUrl ? (
                            <img 
                              src={asset.logoUrl} 
                              alt={asset.ticker}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium text-sm truncate pr-2">{asset.name}</p>
                            <ArrowUp className="w-5 h-5 text-destructive flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                              {asset.ticker}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                              {asset.sector}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/L (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EV/EBTIDA</span>
                          <span className="text-foreground">{formatNumber(asset.evEbtida)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/VP</span>
                          <span className="text-foreground">{formatNumber(asset.pvp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ativos que entraram na carteira */}
            {portfolio.newAssets && portfolio.newAssets.length > 0 && (
              <section className="px-4 pb-20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-success rounded-full" />
                  <h3 className="text-foreground font-semibold">Ativos que entraram na carteira</h3>
                </div>

                <div className="space-y-3">
                  {portfolio.newAssets.map((asset, index) => (
                    <div key={index} className="glass rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {asset.logoUrl ? (
                            <img 
                              src={asset.logoUrl} 
                              alt={asset.ticker}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium text-sm truncate pr-2">{asset.name}</p>
                            <ArrowDown className="w-5 h-5 text-success flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                              {asset.ticker}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                              {asset.sector}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/L (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EV/EBTIDA</span>
                          <span className="text-foreground">{formatNumber(asset.evEbtida)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/VP</span>
                          <span className="text-foreground">{formatNumber(asset.pvp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default CarteiraDetailDrawer;
