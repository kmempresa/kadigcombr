import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Sun,
  Moon,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import RelatorioDetailDrawer from "./RelatorioDetailDrawer";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  ticker: string;
  date: string;
  publishedAt: string;
}

interface RelatoriosDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_FILTERS = ['Todos', 'Ações', 'FIIs', 'Macro Strategy', 'BDRs', 'Análise Técnica'];

const RelatoriosDrawer = ({ open, onOpenChange }: RelatoriosDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      console.log(`Fetching reports: category=${selectedCategory}, page=${currentPage}`);
      const { data, error } = await supabase.functions.invoke('market-reports', {
        body: { 
          type: 'list', 
          category: selectedCategory,
          page: currentPage,
          limit: 10,
        }
      });

      if (error) throw error;

      if (data?.reports) {
        console.log(`Loaded ${data.reports.length} reports`);
        setReports(data.reports);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open, selectedCategory, currentPage]);

  const filteredReports = reports.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = (reportId: string) => {
    setSelectedReportId(reportId);
    setDetailOpen(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
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
            {/* Hero Banner - Kadig Style with Purple Accent */}
            <div className="relative h-72 bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(270,50%,15%)] to-[hsl(280,60%,20%)] overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-2xl" />
              
              {/* Decorative lines */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent" />
                <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              </div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 relative z-10">
                <h1 className="text-4xl font-bold text-purple-400 mb-2" style={{ textShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}>
                  Relatórios
                </h1>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Relatórios detalhados e análises precisas para redirecionar seus investimentos.
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

            {/* Últimos relatórios */}
            <section className="p-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-lg font-semibold text-foreground">Últimos relatórios</h2>
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
                <span className="text-muted-foreground text-sm py-2 flex-shrink-0">Filtros:</span>
                {CATEGORY_FILTERS.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-2xl p-4"
                    >
                      {/* Report Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-foreground font-semibold text-sm line-clamp-2">
                            {report.title}
                          </h3>
                        </div>
                      </div>

                      <div className="h-px bg-border mb-3" />

                      {/* Category Badge */}
                      <div className="mb-2">
                        <span className="inline-block bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-md">
                          {report.category === 'FIIs' ? 'FIIS' : report.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Date */}
                      <p className="text-muted-foreground text-xs mb-2">
                        Data: {new Date(report.date).toLocaleDateString('pt-BR')}
                      </p>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {report.description}
                      </p>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenDetail(report.id)}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-3 rounded-xl flex items-center justify-between px-4 transition-colors"
                      >
                        <span>Conferir relatório</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                      }
                      if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </section>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Detail Drawer */}
      <RelatorioDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        reportId={selectedReportId}
      />
    </>
  );
};

export default RelatoriosDrawer;
