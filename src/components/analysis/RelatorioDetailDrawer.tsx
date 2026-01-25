import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { downloadPDF, isNativePlatform } from "@/lib/nativeDownload";

interface Analyst {
  name: string;
  avatarUrl: string;
}

interface StockData {
  ticker: string;
  name: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  logoUrl: string | null;
  priceEarnings: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  sector: string | null;
}

interface ReportDetail {
  id: string;
  title: string;
  category: string;
  ticker: string;
  publishedAt: string;
  analysts: Analyst[];
  content: string;
  stockData: StockData | null;
  recommendation: string;
  targetPrice: string | null;
  lastUpdate: string;
}

interface RelatorioDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string | null;
}

const RelatorioDetailDrawer = ({ open, onOpenChange, reportId }: RelatorioDetailDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchReportDetail = async () => {
    if (!reportId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching report detail for ${reportId}...`);
      const { data, error } = await supabase.functions.invoke('market-reports', {
        body: { type: 'detail', reportId }
      });

      if (error) throw error;

      if (data) {
        console.log(`Loaded report: ${data.title}`);
        setReport(data);
      }
    } catch (error) {
      console.error("Error fetching report detail:", error);
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && reportId) {
      fetchReportDetail();
    }
  }, [open, reportId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMarketCap = (value: number | null) => {
    if (!value) return '-';
    if (value >= 1e12) return `R$ ${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'COMPRA FORTE':
      case 'COMPRA':
        return 'text-success bg-success/20';
      case 'NEUTRO':
        return 'text-warning bg-warning/20';
      case 'CAUTELA':
      case 'VENDA':
        return 'text-destructive bg-destructive/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;

    setDownloadingPdf(true);
    toast.info("Gerando PDF...");

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header with Kadig branding - Cyan theme
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Cyan accent for reports
      pdf.setFillColor(0, 212, 255);
      pdf.rect(0, 45, pageWidth, 2, 'F');

      // Logo
      pdf.setTextColor(0, 212, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KADIG', margin, 22);

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      const titleLines = pdf.splitTextToSize(report.title, pageWidth - margin * 2);
      pdf.text(titleLines[0], margin, 38);

      yPos = 60;

      // Category and date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${report.category} • Publicado em ${report.publishedAt}`, margin, yPos);
      yPos += 10;

      // Recommendation badge
      if (report.recommendation) {
        pdf.setFillColor(240, 240, 245);
        pdf.roundedRect(margin, yPos, 60, 12, 2, 2, 'F');
        
        let recColor = [100, 100, 100];
        if (report.recommendation.includes('COMPRA')) recColor = [34, 197, 94];
        else if (report.recommendation === 'CAUTELA') recColor = [239, 68, 68];
        
        pdf.setTextColor(recColor[0], recColor[1], recColor[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Recomendação: ${report.recommendation}`, margin + 3, yPos + 8);
        yPos += 18;
      }

      // Stock data card
      if (report.stockData) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, 'F');
        
        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(report.stockData.ticker, margin + 5, yPos + 10);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(report.stockData.name || '', margin + 5, yPos + 17);
        
        // Price
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text(formatCurrency(report.stockData.regularMarketPrice), margin + 5, yPos + 30);
        
        const changeColor = report.stockData.regularMarketChangePercent >= 0 ? [34, 197, 94] : [239, 68, 68];
        pdf.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
        pdf.setFontSize(10);
        pdf.text(`${report.stockData.regularMarketChangePercent >= 0 ? '+' : ''}${report.stockData.regularMarketChangePercent.toFixed(2)}%`, margin + 50, yPos + 30);
        
        // Indicators on the right
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const rightCol = pageWidth - margin - 50;
        pdf.text(`P/L: ${report.stockData.priceEarnings?.toFixed(2) || '-'}`, rightCol, yPos + 10);
        pdf.text(`P/VP: ${report.stockData.priceToBook?.toFixed(2) || '-'}`, rightCol, yPos + 17);
        pdf.text(`Div. Yield: ${report.stockData.dividendYield?.toFixed(2) || '-'}%`, rightCol, yPos + 24);
        pdf.text(`Market Cap: ${formatMarketCap(report.stockData.marketCap)}`, rightCol, yPos + 31);
        
        yPos += 48;
      }

      // Content
      pdf.setTextColor(30, 30, 30);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      // Remove markdown-style formatting
      const cleanContent = report.content
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '');
      
      const contentLines = pdf.splitTextToSize(cleanContent, pageWidth - margin * 2);
      
      for (const line of contentLines) {
        if (yPos > pageHeight - 25) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(line, margin, yPos);
        yPos += 5;
      }

      // Footer on all pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(7);
        pdf.text(`KADIG Análises • ${new Date().toLocaleDateString('pt-BR')} • Este relatório não constitui recomendação de investimento`, margin, pageHeight - 5);
        pdf.text(`Página ${i}/${totalPages}`, pageWidth - margin - 20, pageHeight - 5);
      }

      // Generate file name
      const fileName = `Relatorio_${report.ticker}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Check if we're on native platform
      if (isNativePlatform()) {
        // Get PDF as base64 for native download
        const pdfBase64 = pdf.output('datauristring');
        await downloadPDF(pdfBase64, fileName);
        toast.success("PDF salvo com sucesso!");
      } else {
        // Web: use traditional download
        pdf.save(fileName);
        toast.success("PDF baixado com sucesso!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!reportId) return null;

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
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando relatório...</p>
          </div>
        ) : report ? (
          <div className="flex-1 overflow-y-auto">
            {/* Hero Section - Cyan/Teal Kadig theme */}
            <div className="relative min-h-[400px] bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(200,60%,10%)] to-[hsl(180,50%,12%)] p-6 overflow-hidden">
              {/* Chart background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
              </div>
              
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl" />

              <div className="relative z-10">
                <button 
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground text-sm mb-6 underline hover:text-foreground transition-colors"
                >
                  Voltar
                </button>

                <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
                  {report.title}
                </h1>
                
                <p className="text-muted-foreground text-sm mb-6">
                  Publicado em {report.publishedAt}
                </p>

                {/* Analysts */}
                {report.analysts && report.analysts.length > 0 && (
                  <div className="mb-6">
                    <p className="text-muted-foreground text-xs mb-2">Analistas:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.analysts.map((analyst, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                          <img
                            src={analyst.avatarUrl}
                            alt={analyst.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-foreground text-xs">{analyst.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock summary card */}
                {report.stockData && (
                  <div className="glass rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      {report.stockData.logoUrl && (
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                          <img 
                            src={report.stockData.logoUrl} 
                            alt={report.stockData.ticker}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-foreground font-bold">{report.stockData.ticker}</p>
                        <p className="text-muted-foreground text-xs truncate max-w-[200px]">{report.stockData.name}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-foreground font-bold text-lg">
                          {formatCurrency(report.stockData.regularMarketPrice)}
                        </p>
                        <p className={`text-sm font-medium ${report.stockData.regularMarketChangePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {report.stockData.regularMarketChangePercent >= 0 ? '+' : ''}{report.stockData.regularMarketChangePercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Recommendation and Target */}
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRecommendationColor(report.recommendation)}`}>
                        {report.recommendation}
                      </div>
                      {report.targetPrice && (
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Target className="w-3 h-3" />
                          <span>Preço-alvo: R$ {report.targetPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button 
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span>{downloadingPdf ? 'Gerando PDF...' : 'Baixar Relatório'}</span>
                </button>
              </div>
            </div>

            {/* Stock Indicators */}
            {report.stockData && (
              <section className="p-4">
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-teal-400 rounded-full" />
                    <h3 className="text-foreground font-semibold">Indicadores</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">P/L (12M)</p>
                      <p className="text-foreground font-medium">{report.stockData.priceEarnings?.toFixed(2) || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">P/VP</p>
                      <p className="text-foreground font-medium">{report.stockData.priceToBook?.toFixed(2) || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Dividend Yield</p>
                      <p className="text-foreground font-medium">{report.stockData.dividendYield?.toFixed(2) || '-'}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Market Cap</p>
                      <p className="text-foreground font-medium">{formatMarketCap(report.stockData.marketCap)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Máx. 52 sem.</p>
                      <p className="text-foreground font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        {report.stockData.fiftyTwoWeekHigh ? formatCurrency(report.stockData.fiftyTwoWeekHigh) : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Mín. 52 sem.</p>
                      <p className="text-foreground font-medium flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-destructive" />
                        {report.stockData.fiftyTwoWeekLow ? formatCurrency(report.stockData.fiftyTwoWeekLow) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Analysis Content */}
            <section className="px-4 pb-20">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-teal-400 rounded-full" />
                  <h3 className="text-foreground font-semibold">Análise</h3>
                </div>

                <div className="prose prose-sm prose-invert max-w-none">
                  {report.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      {paragraph.replace(/\*\*/g, '').replace(/\*/g, '')}
                    </p>
                  ))}
                </div>

                {report.lastUpdate && (
                  <p className="text-muted-foreground/60 text-xs mt-6 pt-4 border-t border-border">
                    Última atualização: {new Date(report.lastUpdate).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default RelatorioDetailDrawer;
