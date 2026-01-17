import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, X, Search, ChevronLeft, Loader2, Check, TrendingUp, TrendingDown, ChevronRight, HelpCircle, FileEdit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

// Tipos de ativos disponíveis
const tiposAtivos = [
  { id: "acoes", nome: "Ações, Stocks e ETF", cor: "#ef4444" },
  { id: "bdrs", nome: "BDRs", cor: "#f97316" },
  { id: "conta_corrente", nome: "Conta Corrente", cor: "#eab308" },
  { id: "criptoativos", nome: "Criptoativos", cor: "#22c55e" },
  { id: "debentures", nome: "Debêntures", cor: "#14b8a6" },
  { id: "fundos", nome: "Fundos", cor: "#06b6d4" },
  { id: "fiis", nome: "FIIs e REITs", cor: "#3b82f6" },
  { id: "moedas", nome: "Moedas", cor: "#8b5cf6" },
  { id: "personalizados", nome: "Personalizados", cor: "#a855f7" },
  { id: "poupanca", nome: "Poupança", cor: "#d946ef" },
  { id: "previdencia", nome: "Previdência", cor: "#ec4899" },
  { id: "renda_fixa_pre", nome: "Renda Fixa Prefixada", cor: "#f43f5e" },
  { id: "renda_fixa_pos", nome: "Renda Fixa Pós-fixada", cor: "#be185d" },
  { id: "tesouro", nome: "Tesouro Direto", cor: "#9d174d" },
];

interface StockData {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  logoUrl?: string | null;
  currency?: string;
  marketCap?: number;
  sector?: string;
  industry?: string;
}

// Lista completa de instituições financeiras brasileiras
const instituicoesFinanceiras = [
  "ITAÚ UNIBANCO S.A.",
  "BANCO DO BRASIL S.A.",
  "BANCO BRADESCO S.A.",
  "CAIXA ECONÔMICA FEDERAL",
  "BANCO SANTANDER (BRASIL) S.A.",
  "BTG PACTUAL S.A.",
  "BANCO SAFRA S.A.",
  "XP INVESTIMENTOS CCTVM S.A.",
  "NU PAGAMENTOS S.A. (NUBANK)",
  "BANCO INTER S.A.",
  "BANCO ORIGINAL S.A.",
  "C6 BANK S.A.",
  "BANCO PAN S.A.",
  "BANCO VOTORANTIM S.A.",
  "BANCO CITIBANK S.A.",
  "BANCO BNP PARIBAS BRASIL S.A.",
  "BANCO CREDIT SUISSE (BRASIL) S.A.",
  "BANCO J.P. MORGAN S.A.",
  "GOLDMAN SACHS DO BRASIL BM S.A.",
  "MORGAN STANLEY CTVM S.A.",
  "BANCO MODAL S.A.",
  "BANCO DAYCOVAL S.A.",
  "BANCO ABC BRASIL S.A.",
  "BANCO BMG S.A.",
  "BANCO MERCANTIL DO BRASIL S.A.",
  "BANCO PINE S.A.",
  "BANCO ALFA S.A.",
  "BANCO FIBRA S.A.",
  "BANCO INDUSTRIAL DO BRASIL S.A.",
  "BANCO SOFISA S.A.",
  "BANCO BANRISUL S.A.",
  "BANCO DO NORDESTE DO BRASIL S.A.",
  "BANCO DA AMAZÔNIA S.A.",
  "BANCO COOPERATIVO SICREDI S.A.",
  "BANCO COOPERATIVO DO BRASIL S.A. (BANCOOB)",
  "BANCO DE DESENVOLVIMENTO DE MINAS GERAIS S.A. (BDMG)",
  "BNDES - BANCO NACIONAL DE DESENVOLVIMENTO",
  "RICO INVESTIMENTOS",
  "CLEAR CORRETORA CTVM S.A.",
  "EASYNVEST - TÍTULO CV S.A.",
  "ÁGORA INVESTIMENTOS S.A. CTVM",
  "GUIDE INVESTIMENTOS S.A. CV",
  "GENIAL INVESTIMENTOS CVM S.A.",
  "TORO INVESTIMENTOS S.A. CTVM",
  "ÓRAMA DTVM S.A.",
  "WARREN CVMC LTDA.",
  "VITREO DTVM S.A.",
  "AVENUE SECURITIES LLC",
  "PASSFOLIO SECURITIES LLC",
  "STAKE SECURITIES LLC",
  "NOMAD HOLDING LLC",
  "WISE PAYMENTS LIMITED",
  "MERCADO PAGO",
  "PICPAY SERVIÇOS S.A.",
  "PAGSEGURO INTERNET S.A.",
  "STONE PAGAMENTOS S.A.",
  "CIELO S.A.",
  "REDE S.A.",
  "GETNET ADQUIRÊNCIA E SERVIÇOS",
  "FINAMAX S.A. FINANCEIRA",
  "COLUNA S/A. DTVM",
  "BARIGUI S.A. FINANCEIRA",
  "PLANNER CORRETORA DE VALORES S.A.",
  "BV FINANCEIRA S.A. FINANCEIRA",
  "CA INDOSUEZ WEALTH (BRAZIL) S.A. DTVM",
  "PORTOCRED S.A. FINANCEIRA",
  "LUIZACRED S.A. SOCIEDADE DE FINANCEIRA",
  "MERRILL LYNCH S.A. CTVM",
  "UBS BRASIL CCTVM S.A.",
  "CREDIT AGRICOLE BRASIL S.A. DTVM",
  "HSBC CTVM S.A.",
  "BANCO RCI BRASIL S.A.",
  "BANCO VOLKSWAGEN S.A.",
  "BANCO TOYOTA DO BRASIL S.A.",
  "BANCO HONDA S.A.",
  "BANCO GM S.A.",
  "BANCO HYUNDAI CAPITAL BRASIL S.A.",
  "BANCO YAMAHA MOTOR DO BRASIL S.A.",
  "BANCO FIDIS S.A.",
  "BANCO CNH INDUSTRIAL CAPITAL S.A.",
  "BANCO CARREFOUR S.A.",
  "BANCO LOSANGO S.A.",
  "BANCO CETELEM S.A.",
  "BANCO AGIPLAN S.A.",
  "BANCO SEMEAR S.A.",
  "BANCO BARI S.A.",
  "BANCO BS2 S.A.",
  "BANCO NEON S.A.",
  "BANCO DIGIMAIS S.A.",
  "BANCO ARBI S.A.",
  "BANCO MÁXIMA S.A.",
  "BANCO PAULISTA S.A.",
  "BANCO RENDIMENTO S.A.",
  "BANCO SISTEMA S.A.",
  "BANCO TOPÁZIO S.A.",
  "BANCO TRIANGULO S.A.",
  "BANCO VOITER S.A.",
  "BANCO CARGILL S.A.",
  "BANCO JOHN DEERE S.A.",
  "BANCO KOMATSU S.A.",
  "BANCO RANDON S.A.",
  "BANCO VOLVO BRASIL S.A.",
  "BANCO SCANIA S.A.",
  "BANCO MERCEDES-BENZ S.A.",
  "BANCO CATERPILLAR S.A.",
  "BANCO MONEO S.A.",
  "BANCO WESTERN UNION DO BRASIL S.A.",
  "BANCO BRADESCARD S.A.",
  "BANCO CSF S.A.",
  "BANCO FATOR S.A.",
  "BANCO GUANABARA S.A.",
  "BANCO INDUSVAL S.A.",
  "BANCO LUSO BRASILEIRO S.A.",
  "BANCO OURINVEST S.A.",
  "BANCO POTTENCIAL S.A.",
  "BANCO RABOBANK INTERNATIONAL BRASIL S.A.",
  "BANCO RIBEIRAO PRETO S.A.",
  "BANCO SMARTBANK S.A.",
  "BANCO SOCINAL S.A.",
  "BANCO SUMITOMO MITSUI BRASILEIRO S.A.",
  "BANCO VR S.A.",
  "BANCO XCMG BRASIL S.A.",
  "BRB - BANCO DE BRASÍLIA S.A.",
  "CREFISA S.A. CFI",
  "OMNI BANCO S.A.",
  "PARANÁ BANCO S.A.",
  "SICOOB CREDICITRUS",
  "SICOOB COCRED",
  "SICOOB CREDISAN",
  "SICOOB CREDICOM",
  "SICOOB CREDIP",
  "SICOOB UNICRED",
  "SICREDI PIONEIRA RS",
  "SICREDI UNIÃO PR/SP",
  "SICREDI CENTRO SUL MS",
  "SICREDI SERRANA RS",
  "CRESOL BASER",
  "CRESOL CONFEDERAÇÃO",
  "UNICRED CENTRAL RS",
  "UNICRED DO BRASIL",
  "AILOS CENTRAL DE COOPERATIVAS",
  "CECRED - CENTRAL DAS COOPERATIVAS",
  "VIACREDI - COOPERATIVA DE CRÉDITO",
  "CREDITAG DTVM S.A.",
  "CM CAPITAL MARKETS CCTVM LTDA",
  "COINVALORES CCVM LTDA",
  "ELITE CCVM LTDA",
  "FATOR CORRETORA DE VALORES S.A.",
  "H.COMMCOR DTVM LTDA",
  "HAITONG SECURITIES DO BRASIL CCVM S.A.",
  "ICAP DO BRASIL CTVM LTDA",
  "LEROSA S.A. CORRETORES DE VALORES",
  "MAGLIANO S.A. CCVM",
  "MUNDINVEST S.A. CCVM",
  "NOVA FUTURA CTVM LTDA",
  "NOVUS CAPITAL INVESTIMENTOS S.A.",
  "OLIVEIRA TRUST SERVICER S.A.",
  "SINGULARE CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.",
  "SOLIDUS S/A CCVM",
  "SOCOPA SC PAULISTA S.A.",
  "TERRA INVESTIMENTOS DTVM LTDA",
  "TULLETT PREBON BRASIL S.A. CTVM",
  "VINCI PARTNERS INVESTIMENTOS LTDA",
  "VOITER S.A. DTVM",
  "WALPIRES S.A. CCTVM",
  "BANCO B3 S.A.",
  "B3 S.A. - BRASIL, BOLSA, BALCÃO",
  "TESOURO NACIONAL",
  "BANCO CENTRAL DO BRASIL",
].sort();

const AdicionarInvestimento = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1 - Asset type selection
  const [selectedTipoAtivo, setSelectedTipoAtivo] = useState<string | null>(null);
  
  // Step 2 - Institution search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstituicao, setSelectedInstituicao] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  // Step 3 - Asset search
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<StockData | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Step 4 - Quantity and values
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [brokerageFee, setBrokerageFee] = useState("");

  const totalSteps = 5;
  
  // Get title based on asset type
  const getAssetTypeTitle = () => {
    const tipo = tiposAtivos.find(t => t.id === selectedTipoAtivo);
    if (!tipo) return "Adicionar Ativo";
    if (tipo.id === "acoes") return "Adicionar Ação";
    if (tipo.id === "bdrs") return "Adicionar BDR";
    if (tipo.id === "fiis") return "Adicionar FII";
    if (tipo.id === "criptoativos") return "Adicionar Criptoativo";
    return `Adicionar ${tipo.nome}`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  // Search for assets when typing
  const searchAssets = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoadingAssets(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'all' }
      });
      
      if (error) throw error;
      
      // Filter by search term
      const allStocks = [...(data.maioresAltas || []), ...(data.maioresBaixas || [])];
      const uniqueStocks = allStocks.filter((stock: StockData, index: number, self: StockData[]) => 
        index === self.findIndex(s => s.symbol === stock.symbol)
      );
      
      const filtered = uniqueStocks.filter((stock: StockData) => 
        stock.symbol.toLowerCase().includes(term.toLowerCase()) ||
        stock.shortName?.toLowerCase().includes(term.toLowerCase())
      );
      
      setSearchResults(filtered.slice(0, 10));
    } catch (error) {
      console.error("Error searching assets:", error);
    }
    setLoadingAssets(false);
  };

  // Fetch detailed asset info when selected
  const fetchAssetDetails = async (symbol: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'detail', symbol }
      });
      
      if (error) throw error;
      
      setAssetDetails(data);
      // Auto-fill purchase price with current price
      if (data?.regularMarketPrice) {
        setPurchasePrice(data.regularMarketPrice.toFixed(2));
      }
    } catch (error) {
      console.error("Error fetching asset details:", error);
    }
    setLoadingDetails(false);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (assetSearchTerm) {
        searchAssets(assetSearchTerm);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [assetSearchTerm]);

  useEffect(() => {
    if (selectedAsset) {
      fetchAssetDetails(selectedAsset.symbol);
    }
  }, [selectedAsset]);

  const filteredInstituicoes = useMemo(() => {
    if (!searchTerm.trim()) return instituicoesFinanceiras;
    return instituicoesFinanceiras.filter(inst =>
      inst.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const canAdvance = 
    step === 1 ? selectedTipoAtivo !== null : 
    step === 2 ? selectedInstituicao !== "" : 
    step === 3 ? selectedAsset !== null :
    step === 4 ? quantity !== "" && purchasePrice !== "" :
    true;

  const handleAdvance = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - save investment to database
      if (!userId || !selectedAsset) return;
      
      try {
        // Get or create portfolio
        let { data: portfolios } = await supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        
        let portfolioId = portfolios?.[0]?.id;
        
        if (!portfolioId) {
          const { data: newPortfolio } = await supabase
            .from('portfolios')
            .insert({ user_id: userId, name: 'Minha Carteira' })
            .select('id')
            .single();
          portfolioId = newPortfolio?.id;
        }
        
        if (portfolioId) {
          const totalInvested = parseFloat(quantity) * parseFloat(purchasePrice);
          const currentValue = parseFloat(quantity) * (assetDetails?.regularMarketPrice || parseFloat(purchasePrice));
          const gainPercent = ((currentValue - totalInvested) / totalInvested) * 100;
          
          await supabase.from('investments').insert({
            user_id: userId,
            portfolio_id: portfolioId,
            asset_name: selectedAsset.shortName || selectedAsset.symbol,
            asset_type: 'Ação',
            ticker: selectedAsset.symbol,
            quantity: parseFloat(quantity),
            purchase_price: parseFloat(purchasePrice),
            current_price: assetDetails?.regularMarketPrice || parseFloat(purchasePrice),
            total_invested: totalInvested,
            current_value: currentValue,
            gain_percent: gainPercent,
          });
        }
        
        navigate("/app");
      } catch (error) {
        console.error("Error saving investment:", error);
      }
    }
  };

  const handleCancel = () => {
    navigate("/app");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  return (
    <div className="light-theme min-h-screen bg-background flex flex-col fixed inset-0">
      {/* Header */}
      <header className="p-4 border-b border-border safe-area-inset-top">
        <div className="flex items-center justify-center relative">
          <button 
            onClick={handleCancel}
            className="absolute left-0 p-2 text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{step === 1 ? "Adicionar novo ativo" : getAssetTypeTitle()}</h1>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                i < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            {/* Help icon in header area */}
            <div className="flex justify-end -mt-2 mb-2">
              <button className="p-2 text-muted-foreground">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Asset Type List */}
            <div className="space-y-2">
              {tiposAtivos.map((tipo) => (
                <motion.button
                  key={tipo.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTipoAtivo(tipo.id)}
                  className={`w-full p-4 bg-card border rounded-2xl text-left flex items-center justify-between transition-all ${
                    selectedTipoAtivo === tipo.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: tipo.cor }}
                    />
                    <span className="text-foreground font-medium text-sm">
                      {tipo.nome}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Buscar nova instituição
            </h2>
            <p className="text-center text-xs text-muted-foreground">
              Tipo: <strong>{tiposAtivos.find(t => t.id === selectedTipoAtivo)?.nome}</strong>
            </p>

            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pr-10 bg-card border-border rounded-xl"
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Institution List */}
            <div className="space-y-2">
              {filteredInstituicoes.map((instituicao) => (
                <motion.button
                  key={instituicao}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedInstituicao(instituicao)}
                  className={`w-full p-4 bg-card border rounded-xl text-left flex items-center justify-between transition-all ${
                    selectedInstituicao === instituicao
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <span className="text-foreground font-medium text-sm">
                    {instituicao}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedInstituicao === instituicao
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedInstituicao === instituicao && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </motion.button>
              ))}

              {filteredInstituicoes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma instituição encontrada
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Escolha o papel
            </h2>

            {/* Asset Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar..."
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value.toUpperCase())}
                className="h-12 pr-10 bg-card border-border rounded-2xl"
              />
              {loadingAssets ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
              ) : assetSearchTerm ? (
                <button
                  onClick={() => { setAssetSearchTerm(""); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : null}
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              {searchResults.map((stock) => (
                <motion.button
                  key={stock.symbol}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAsset(stock)}
                  className={`w-full p-4 bg-card border rounded-2xl text-left flex items-center justify-between transition-all ${
                    selectedAsset?.symbol === stock.symbol
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Brazil flag emoji for BDRs */}
                    <span className="text-lg">🇧🇷</span>
                    <span className="font-medium text-foreground text-sm">
                      {stock.symbol}: {stock.shortName?.toUpperCase() || stock.symbol}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedAsset?.symbol === stock.symbol
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedAsset?.symbol === stock.symbol && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </motion.button>
              ))}

              {searchResults.length === 0 && assetSearchTerm.length >= 2 && !loadingAssets && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum ativo encontrado
                </div>
              )}
              
              {assetSearchTerm.length < 2 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Digite pelo menos 2 caracteres para buscar
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Informações adicionais</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Informe a data, quantidade, valor da compra e quais os valores pagos em taxas de corretagem, emolumentos e liquidação.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <FileEdit className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Form Title */}
            <h2 className="text-center text-foreground font-medium">
              Preencha as informações
            </h2>

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Data de compra */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data de compra:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                    placeholder="DD.MM.AAAA"
                  />
                  {purchaseDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>

              {/* Quantidade */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Quantidade:</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-24"
                />
              </div>

              {/* Preço */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Preço:</span>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="R$ 00,00"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-32"
                />
              </div>

              {/* Taxa */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Taxa (corretagem e outros):</span>
                <input
                  type="number"
                  value={brokerageFee}
                  onChange={(e) => setBrokerageFee(e.target.value)}
                  placeholder="R$ 00,00 (opcional)"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-40"
                />
              </div>

              {/* Total investido */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">Total investido:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(
                    (parseFloat(quantity) || 0) * (parseFloat(purchasePrice) || 0) + (parseFloat(brokerageFee) || 0)
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Confirmação
            </h2>
            
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                {selectedAsset && (
                  <>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {selectedAsset.logoUrl ? (
                        <img src={selectedAsset.logoUrl} alt={selectedAsset.symbol} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{selectedAsset.symbol.slice(0, 3)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{selectedAsset.symbol}</p>
                      <p className="text-sm text-muted-foreground">{selectedAsset.shortName}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de ativo</span>
                  <span className="font-medium text-foreground text-right text-sm">{tiposAtivos.find(t => t.id === selectedTipoAtivo)?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instituição</span>
                  <span className="font-medium text-foreground text-right text-sm">{selectedInstituicao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className="font-medium text-foreground">{quantity} ações</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço de compra</span>
                  <span className="font-medium text-foreground">{formatCurrency(parseFloat(purchasePrice) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço atual</span>
                  <span className="font-medium text-foreground">{formatCurrency(assetDetails?.regularMarketPrice || parseFloat(purchasePrice) || 0)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">Total investido</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(parseFloat(quantity) * parseFloat(purchasePrice))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-500" />
              <p className="text-sm text-emerald-700">Pronto para adicionar à sua carteira!</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex gap-3">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/app")}
            className="flex-1 h-14 bg-card border border-border rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-foreground font-medium">Voltar</span>
          </button>

          <button
            onClick={handleAdvance}
            disabled={!canAdvance}
            className="flex-1 h-14 bg-card border border-border rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-foreground font-medium">Avançar</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AdicionarInvestimento;
