import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, X, Search, ChevronLeft, Loader2, Check, TrendingUp, TrendingDown, ChevronRight, HelpCircle, FileEdit, BarChart3, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { notifyInvestmentAdded } from "@/lib/notifications";

// Tipos de ativos disponíveis com fluxos específicos
// Fluxos:
// "ativo" - Buscar ativo via API (Ações, BDRs, FIIs, Fundos)
// "cripto" - Lista predefinida de criptos + data compra + cotação + quantidade
// "simples" - Apenas valor e % CDI opcional (Conta Corrente, Poupança)
// "moeda" - Lista predefinida de moedas + data compra + cotação + quantidade
// "personalizado" - Nome customizado + data + valor
// "renda_fixa" - Taxa, vencimento, indexador (Debêntures, Previdência, Renda Fixa, Tesouro)
const tiposAtivos = [
  { id: "acoes", nome: "Ações, Stocks e ETF", cor: "#ef4444", fluxo: "ativo" },
  { id: "bdrs", nome: "BDRs", cor: "#f97316", fluxo: "ativo" },
  { id: "conta_corrente", nome: "Conta Corrente", cor: "#eab308", fluxo: "simples" },
  { id: "criptoativos", nome: "Criptoativos", cor: "#22c55e", fluxo: "cripto" },
  { id: "debentures", nome: "Debêntures", cor: "#14b8a6", fluxo: "renda_fixa" },
  { id: "fundos", nome: "Fundos", cor: "#06b6d4", fluxo: "ativo" },
  { id: "fiis", nome: "FIIs e REITs", cor: "#3b82f6", fluxo: "ativo" },
  { id: "moedas", nome: "Moedas", cor: "#8b5cf6", fluxo: "moeda" },
  { id: "personalizados", nome: "Personalizados", cor: "#a855f7", fluxo: "personalizado" },
  { id: "poupanca", nome: "Poupança", cor: "#d946ef", fluxo: "simples" },
  { id: "previdencia", nome: "Previdência", cor: "#ec4899", fluxo: "renda_fixa" },
  { id: "renda_fixa_pre", nome: "Renda Fixa Prefixada", cor: "#f43f5e", fluxo: "renda_fixa" },
  { id: "renda_fixa_pos", nome: "Renda Fixa Pós-fixada", cor: "#be185d", fluxo: "renda_fixa" },
  { id: "tesouro", nome: "Tesouro Direto", cor: "#9d174d", fluxo: "renda_fixa" },
];

// Lista de criptoativos
const listaCriptoativos = [
  "BITCOIN",
  "LITECOIN",
  "BCASH",
  "XRP (RIPPLE)",
  "ETHEREUM",
  "SOLANA",
  "CARDANO",
  "POLKADOT",
  "DOGECOIN",
  "SHIBA INU",
  "BNB",
  "AVALANCHE",
  "TRON",
  "CHAINLINK",
  "UNISWAP",
];

// Lista de moedas
const listaMoedas = [
  "DÓLAR AMERICANO (USD)",
  "EURO (EUR)",
  "LIBRA ESTERLINA (GBP)",
  "IENE JAPONÊS (JPY)",
  "FRANCO SUÍÇO (CHF)",
  "DÓLAR CANADENSE (CAD)",
  "DÓLAR AUSTRALIANO (AUD)",
  "PESO ARGENTINO (ARS)",
  "YUAN CHINÊS (CNY)",
  "PESO MEXICANO (MXN)",
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
  const { selectedPortfolioId, refreshPortfolios } = usePortfolio();
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
  
  // Step 4 - Quantity and values (for "ativo" flow)
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [brokerageFee, setBrokerageFee] = useState("");
  
  // For "simples" flow (Conta Corrente, Poupança, etc)
  const [investmentValue, setInvestmentValue] = useState("");
  const [cdiPercentage, setCdiPercentage] = useState("");
  const [hasRemuneration, setHasRemuneration] = useState(false);
  const [startDate, setStartDate] = useState("");
  
  // For "renda_fixa" flow
  const [fixedRate, setFixedRate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [indexer, setIndexer] = useState("CDI");
  
  // For "cripto" and "moeda" flows
  const [selectedCripto, setSelectedCripto] = useState("");
  const [selectedMoeda, setSelectedMoeda] = useState("");
  const [cotacao, setCotacao] = useState("");
  const [cryptoSearchTerm, setCryptoSearchTerm] = useState("");
  const [moedaSearchTerm, setMoedaSearchTerm] = useState("");
  const [loadingCotacao, setLoadingCotacao] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: { price: number; change24h: number } }>({});
  const [currencyPrices, setCurrencyPrices] = useState<{ [key: string]: { price: number; change24h: number } }>({});
  
  // For "personalizado" flow
  const [customAssetName, setCustomAssetName] = useState("");

  // Get current flow type
  const currentFlow = tiposAtivos.find(t => t.id === selectedTipoAtivo)?.fluxo || "ativo";
  
  // Dynamic total steps based on flow
  const getTotalSteps = () => {
    if (currentFlow === "simples") return 4; // Tipo -> Banco -> Valor/% CDI -> Confirmação
    if (currentFlow === "renda_fixa") return 5; // Tipo -> Banco -> Dados -> Valor -> Confirmação
    if (currentFlow === "cripto") return 5; // Tipo -> Banco -> Escolha Cripto -> Dados -> Confirmação
    if (currentFlow === "moeda") return 5; // Tipo -> Banco -> Escolha Moeda -> Dados -> Confirmação
    if (currentFlow === "personalizado") return 4; // Tipo -> Banco -> Dados -> Confirmação
    return 5; // Tipo -> Banco -> Buscar Ativo -> Valor -> Confirmação
  };
  
  const totalSteps = getTotalSteps();
  
  // Filtered lists for cripto and moeda
  const filteredCriptos = useMemo(() => {
    if (!cryptoSearchTerm.trim()) return listaCriptoativos;
    return listaCriptoativos.filter(c => c.toLowerCase().includes(cryptoSearchTerm.toLowerCase()));
  }, [cryptoSearchTerm]);
  
  const filteredMoedas = useMemo(() => {
    if (!moedaSearchTerm.trim()) return listaMoedas;
    return listaMoedas.filter(m => m.toLowerCase().includes(moedaSearchTerm.toLowerCase()));
  }, [moedaSearchTerm]);
  
  // Get title based on asset type
  const getAssetTypeTitle = () => {
    const tipo = tiposAtivos.find(t => t.id === selectedTipoAtivo);
    if (!tipo) return "Adicionar Ativo";
    return tipo.nome;
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

  // Fetch crypto prices when entering crypto flow
  useEffect(() => {
    const fetchCryptoPrices = async () => {
      if (currentFlow === "cripto" && step >= 3 && Object.keys(cryptoPrices).length === 0) {
        setLoadingCotacao(true);
        try {
          const { data, error } = await supabase.functions.invoke('market-data', {
            body: { type: 'crypto-prices' }
          });
          if (!error && data?.prices) {
            setCryptoPrices(data.prices);
            console.log('Crypto prices loaded:', data.prices);
          }
        } catch (error) {
          console.error('Error fetching crypto prices:', error);
        }
        setLoadingCotacao(false);
      }
    };
    fetchCryptoPrices();
  }, [currentFlow, step]);

  // Fetch currency prices when entering currency flow
  useEffect(() => {
    const fetchCurrencyPrices = async () => {
      if (currentFlow === "moeda" && step >= 3 && Object.keys(currencyPrices).length === 0) {
        setLoadingCotacao(true);
        try {
          const { data, error } = await supabase.functions.invoke('market-data', {
            body: { type: 'currency-prices' }
          });
          if (!error && data?.prices) {
            setCurrencyPrices(data.prices);
            console.log('Currency prices loaded:', data.prices);
          }
        } catch (error) {
          console.error('Error fetching currency prices:', error);
        }
        setLoadingCotacao(false);
      }
    };
    fetchCurrencyPrices();
  }, [currentFlow, step]);

  // Auto-fill cotacao when selecting crypto
  useEffect(() => {
    if (selectedCripto && cryptoPrices[selectedCripto]) {
      setCotacao(cryptoPrices[selectedCripto].price.toFixed(2));
    }
  }, [selectedCripto, cryptoPrices]);

  // Auto-fill cotacao when selecting currency
  useEffect(() => {
    if (selectedMoeda && currencyPrices[selectedMoeda]) {
      setCotacao(currencyPrices[selectedMoeda].price.toFixed(4));
    }
  }, [selectedMoeda, currencyPrices]);

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

  // Dynamic validation based on flow
  const canAdvance = () => {
    if (step === 1) return selectedTipoAtivo !== null;
    if (step === 2) return selectedInstituicao !== "";
    
    if (currentFlow === "simples") {
      if (step === 3) return investmentValue !== "" && startDate !== "";
      return true; // Step 4 is confirmation
    }
    
    if (currentFlow === "renda_fixa") {
      if (step === 3) return fixedRate !== "" && maturityDate !== "";
      if (step === 4) return investmentValue !== "";
      return true; // Step 5 is confirmation
    }
    
    if (currentFlow === "cripto") {
      if (step === 3) return selectedCripto !== "";
      if (step === 4) return purchaseDate !== "" && cotacao !== "" && quantity !== "";
      return true; // Step 5 is confirmation
    }
    
    if (currentFlow === "moeda") {
      if (step === 3) return selectedMoeda !== "";
      if (step === 4) return purchaseDate !== "" && cotacao !== "" && quantity !== "";
      return true; // Step 5 is confirmation
    }
    
    if (currentFlow === "personalizado") {
      if (step === 3) return customAssetName !== "" && purchaseDate !== "" && investmentValue !== "";
      return true; // Step 4 is confirmation
    }
    
    // Flow "ativo"
    if (step === 3) return selectedAsset !== null;
    if (step === 4) return quantity !== "" && purchasePrice !== "";
    return true;
  };

  const handleAdvance = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - save investment to database
      if (!userId) return;
      
      try {
        // Use selected portfolio from context or get first one
        let portfolioId = selectedPortfolioId;
        let currentPortfolioValue = 0;
        let currentPortfolioGain = 0;
        
        if (portfolioId) {
          const { data: portfolio } = await supabase
            .from('portfolios')
            .select('id, total_value, total_gain')
            .eq('id', portfolioId)
            .single();
          
          if (portfolio) {
            currentPortfolioValue = portfolio.total_value || 0;
            currentPortfolioGain = portfolio.total_gain || 0;
          }
        } else {
          // Fallback: get first portfolio or create one
          let { data: portfolios } = await supabase
            .from('portfolios')
            .select('id, total_value, total_gain')
            .eq('user_id', userId)
            .limit(1);
          
          portfolioId = portfolios?.[0]?.id;
          currentPortfolioValue = portfolios?.[0]?.total_value || 0;
          currentPortfolioGain = portfolios?.[0]?.total_gain || 0;
          
          if (!portfolioId) {
            const { data: newPortfolio } = await supabase
              .from('portfolios')
              .insert({ user_id: userId, name: 'Minha Carteira' })
              .select('id')
              .single();
            portfolioId = newPortfolio?.id;
            currentPortfolioValue = 0;
            currentPortfolioGain = 0;
          }
        }
        
        if (portfolioId) {
          const tipoAtivo = tiposAtivos.find(t => t.id === selectedTipoAtivo);
          const assetTypeLabel = tipoAtivo?.nome || 'Outro';
          
          let totalInvested = 0;
          let currentValue = 0;
          let gainValue = 0;
          let gainPercent = 0;
          let assetName = "";
          let ticker = "";
          let qty = 1;
          let price = 0;
          
          if (currentFlow === "simples") {
            // Conta Corrente, Poupança
            totalInvested = parseFloat(investmentValue) || 0;
            currentValue = totalInvested;
            gainValue = 0;
            gainPercent = 0;
            assetName = `${assetTypeLabel} - ${selectedInstituicao.split(' ')[0]}`;
            ticker = selectedTipoAtivo?.toUpperCase() || '';
            qty = 1;
            price = totalInvested;
          } else if (currentFlow === "renda_fixa") {
            // Debêntures, Previdência, Renda Fixa, Tesouro
            totalInvested = parseFloat(investmentValue) || 0;
            currentValue = totalInvested;
            gainValue = 0;
            gainPercent = parseFloat(fixedRate) || 0;
            assetName = `${assetTypeLabel} - ${selectedInstituicao.split(' ')[0]}`;
            ticker = selectedTipoAtivo?.toUpperCase() || '';
            qty = 1;
            price = totalInvested;
          } else if (currentFlow === "cripto") {
            // Criptoativos - usar cotação atual em tempo real
            qty = parseFloat(quantity) || 0;
            price = parseFloat(cotacao) || 0;
            totalInvested = qty * price;
            // Usar preço atual da API para calcular valor atual
            const currentApiPrice = cryptoPrices[selectedCripto]?.price || price;
            currentValue = qty * currentApiPrice;
            gainValue = currentValue - totalInvested;
            gainPercent = totalInvested > 0 ? (gainValue / totalInvested) * 100 : 0;
            assetName = selectedCripto;
            ticker = selectedCripto.split(' ')[0].toUpperCase();
          } else if (currentFlow === "moeda") {
            // Moedas - usar cotação atual em tempo real
            qty = parseFloat(quantity) || 0;
            price = parseFloat(cotacao) || 0;
            totalInvested = qty * price;
            // Usar preço atual da API para calcular valor atual
            const currentApiPrice = currencyPrices[selectedMoeda]?.price || price;
            currentValue = qty * currentApiPrice;
            gainValue = currentValue - totalInvested;
            gainPercent = totalInvested > 0 ? (gainValue / totalInvested) * 100 : 0;
            assetName = selectedMoeda;
            ticker = selectedMoeda.match(/\(([^)]+)\)/)?.[1] || selectedMoeda.split(' ')[0];
          } else if (currentFlow === "personalizado") {
            // Personalizados
            totalInvested = parseFloat(investmentValue) || 0;
            currentValue = totalInvested;
            gainValue = 0;
            gainPercent = 0;
            assetName = customAssetName;
            ticker = "CUSTOM";
            qty = 1;
            price = totalInvested;
          } else {
            // Ações, BDRs, FIIs, Fundos
            if (!selectedAsset) return;
            qty = parseFloat(quantity) || 0;
            price = parseFloat(purchasePrice) || 0;
            const fee = parseFloat(brokerageFee) || 0;
            totalInvested = (qty * price) + fee;
            const currentPrice = assetDetails?.regularMarketPrice || price;
            currentValue = qty * currentPrice;
            gainValue = currentValue - totalInvested;
            gainPercent = totalInvested > 0 ? (gainValue / totalInvested) * 100 : 0;
            assetName = selectedAsset.shortName || selectedAsset.symbol;
            ticker = selectedAsset.symbol;
          }
          
          // Get current price for crypto/currency
          let currentPriceToSave = price;
          if (currentFlow === "cripto" && cryptoPrices[selectedCripto]) {
            currentPriceToSave = cryptoPrices[selectedCripto].price;
          } else if (currentFlow === "moeda" && currencyPrices[selectedMoeda]) {
            currentPriceToSave = currencyPrices[selectedMoeda].price;
          } else if (currentFlow === "ativo" && assetDetails?.regularMarketPrice) {
            currentPriceToSave = assetDetails.regularMarketPrice;
          }
          
          // Insert investment
          const { data: newInvestment, error: investmentError } = await supabase.from('investments').insert({
            user_id: userId,
            portfolio_id: portfolioId,
            asset_name: assetName,
            asset_type: assetTypeLabel,
            ticker: ticker,
            quantity: qty,
            purchase_price: price,
            current_price: currentPriceToSave,
            total_invested: totalInvested,
            current_value: currentValue,
            gain_percent: gainPercent,
            maturity_date: currentFlow === "renda_fixa" ? maturityDate : null,
          }).select('id').single();
          
          if (investmentError) {
            console.error("Error inserting investment:", investmentError);
            toast.error("Erro ao salvar investimento");
            return;
          }
          
          // Get portfolio name for movement record
          const { data: portfolioData } = await supabase
            .from('portfolios')
            .select('name')
            .eq('id', portfolioId)
            .single();
          
          // Record the movement for "extrato"
          const movementDate = currentFlow === "renda_fixa" ? startDate : 
                              (currentFlow === "cripto" || currentFlow === "moeda") ? purchaseDate :
                              purchaseDate || new Date().toISOString().split('T')[0];
          
          await supabase.from('movements').insert({
            user_id: userId,
            portfolio_id: portfolioId,
            investment_id: newInvestment?.id || null,
            type: 'aplicacao',
            asset_name: assetName,
            ticker: ticker,
            asset_type: assetTypeLabel,
            quantity: qty,
            unit_price: price,
            total_value: totalInvested,
            portfolio_name: portfolioData?.name || 'Minha Carteira',
            notes: `Aplicação inicial - ${selectedInstituicao}`,
            movement_date: movementDate || new Date().toISOString().split('T')[0],
          });
          
          // Update portfolio totals
          const newTotalValue = Number(currentPortfolioValue) + currentValue;
          const newTotalGain = Number(currentPortfolioGain) + gainValue;
          const cdiPercent = newTotalValue > 0 ? ((newTotalGain / newTotalValue) * 100) : 0;
          
          await supabase.from('portfolios').update({
            total_value: newTotalValue,
            total_gain: newTotalGain,
            cdi_percent: cdiPercent,
          }).eq('id', portfolioId);
          
          toast.success("Investimento adicionado com sucesso!");
          
          // Create notification
          await notifyInvestmentAdded(assetName, portfolioData?.name || 'Minha Carteira', totalInvested);
          
          // Refresh portfolios in context
          await refreshPortfolios();
        }
        
        navigate("/app");
      } catch (error) {
        console.error("Error saving investment:", error);
        toast.error("Erro ao salvar investimento");
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

        {/* Step 3 - Different for each flow */}
        {step === 3 && currentFlow === "ativo" && (
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

        {/* Step 3 for SIMPLES flow - Rentabilidade (optional % CDI) */}
        {step === 3 && currentFlow === "simples" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Informações</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Informe a data de início e o valor do investimento.
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
              {/* Data de início */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data de início:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                  />
                  {startDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>

              {/* Conta com remuneração */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Conta com remuneração?:</span>
                <button
                  onClick={() => setHasRemuneration(!hasRemuneration)}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                    hasRemuneration ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {hasRemuneration ? 'Sim' : 'Não'}
                </button>
              </div>

              {/* % sobre o CDI (opcional) */}
              {hasRemuneration && (
                <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-foreground text-sm">% sobre o CDI:</span>
                  <input
                    type="number"
                    value={cdiPercentage}
                    onChange={(e) => setCdiPercentage(e.target.value)}
                    placeholder="0,00% (opcional)"
                    step="0.01"
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-40"
                  />
                </div>
              )}

              {/* Valor do investimento */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Valor do investimento:</span>
                <input
                  type="number"
                  value={investmentValue}
                  onChange={(e) => setInvestmentValue(e.target.value)}
                  placeholder="R$ 0,00"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-32"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 for RENDA_FIXA flow - Taxa e vencimento */}
        {step === 3 && currentFlow === "renda_fixa" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Rentabilidade</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Informe a taxa de rentabilidade e a data de vencimento do seu investimento.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Form Title */}
            <h2 className="text-center text-foreground font-medium">
              Preencha as informações
            </h2>

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Indexador */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Indexador:</span>
                <select
                  value={indexer}
                  onChange={(e) => setIndexer(e.target.value)}
                  className="bg-transparent text-right text-foreground text-sm border-none outline-none"
                >
                  <option value="CDI">CDI</option>
                  <option value="IPCA">IPCA+</option>
                  <option value="SELIC">SELIC</option>
                  <option value="PRE">Prefixado</option>
                </select>
              </div>

              {/* Taxa */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Taxa (% a.a.):</span>
                <input
                  type="number"
                  value={fixedRate}
                  onChange={(e) => setFixedRate(e.target.value)}
                  placeholder="0,00%"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-24"
                />
              </div>

              {/* Vencimento */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data de vencimento:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                  />
                  {maturityDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 for CRIPTO flow - Escolha o criptoativo */}
        {step === 3 && currentFlow === "cripto" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Escolha o criptoativo
            </h2>

            {loadingCotacao && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando cotações em tempo real...
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar:"
                value={cryptoSearchTerm}
                onChange={(e) => setCryptoSearchTerm(e.target.value)}
                className="h-12 pr-10 bg-card border-border rounded-2xl"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>

            {/* Crypto List */}
            <div className="space-y-2">
              {filteredCriptos.map((crypto) => {
                const priceData = cryptoPrices[crypto];
                return (
                  <motion.button
                    key={crypto}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCripto(crypto)}
                    className={`w-full p-4 bg-card border rounded-2xl text-left flex items-center justify-between transition-all ${
                      selectedCripto === crypto
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">{crypto}</span>
                      {priceData && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(priceData.price)}
                          </span>
                          <span className={`text-xs flex items-center ${priceData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {priceData.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                            {priceData.change24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedCripto === crypto
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedCripto === crypto && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {filteredCriptos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum criptoativo encontrado
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4 for CRIPTO flow - Data, cotação e quantidade */}
        {step === 4 && currentFlow === "cripto" && (
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
                  Informe a cotação, quantidade, data da compra e taxas que foram pagas.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <FileEdit className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-center text-foreground font-medium">
              Preencha as informações
            </h2>

            <div className="space-y-3">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data da compra:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                  />
                  {purchaseDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm">Cotação atual (R$):</span>
                  {cryptoPrices[selectedCripto] && (
                    <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      Tempo real
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={cotacao}
                  onChange={(e) => setCotacao(e.target.value)}
                  placeholder="R$ 0,00"
                  step="0.01"
                  className="bg-transparent text-right text-foreground text-sm border-none outline-none w-32 font-medium"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Quantidade:</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  step="0.00000001"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-32"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">Total investido:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency((parseFloat(quantity) || 0) * (parseFloat(cotacao) || 0))}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 for MOEDA flow - Escolha a moeda */}
        {step === 3 && currentFlow === "moeda" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Escolha a moeda
            </h2>

            {loadingCotacao && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando cotações em tempo real...
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar:"
                value={moedaSearchTerm}
                onChange={(e) => setMoedaSearchTerm(e.target.value)}
                className="h-12 pr-10 bg-card border-border rounded-2xl"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>

            {/* Moeda List */}
            <div className="space-y-2">
              {filteredMoedas.map((moeda) => {
                const priceData = currencyPrices[moeda];
                return (
                  <motion.button
                    key={moeda}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMoeda(moeda)}
                    className={`w-full p-4 bg-card border rounded-2xl text-left flex items-center justify-between transition-all ${
                      selectedMoeda === moeda
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">{moeda}</span>
                      {priceData && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(priceData.price)}
                          </span>
                          <span className={`text-xs flex items-center ${priceData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {priceData.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                            {priceData.change24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedMoeda === moeda
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedMoeda === moeda && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {filteredMoedas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma moeda encontrada
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4 for MOEDA flow - Data, cotação e quantidade */}
        {step === 4 && currentFlow === "moeda" && (
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
                  Informe a cotação, quantidade e data da compra.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <FileEdit className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-center text-foreground font-medium">
              Preencha as informações
            </h2>

            <div className="space-y-3">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data da compra:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                  />
                  {purchaseDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm">Cotação atual (R$):</span>
                  {currencyPrices[selectedMoeda] && (
                    <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      Tempo real
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={cotacao}
                  onChange={(e) => setCotacao(e.target.value)}
                  placeholder="R$ 0,00"
                  step="0.0001"
                  className="bg-transparent text-right text-foreground text-sm border-none outline-none w-32 font-medium"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Quantidade:</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-32"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">Total investido:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency((parseFloat(quantity) || 0) * (parseFloat(cotacao) || 0))}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 for PERSONALIZADO flow - Nome e dados */}
        {step === 3 && currentFlow === "personalizado" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Ativo Personalizado</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Informe o nome do seu ativo, a data de início e o valor investido.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <FileEdit className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-center text-foreground font-medium">
              Preencha as informações
            </h2>

            <div className="space-y-3">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Nome do ativo:</span>
                <input
                  type="text"
                  value={customAssetName}
                  onChange={(e) => setCustomAssetName(e.target.value)}
                  placeholder="Ex: Consórcio, Precatório..."
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none flex-1 ml-4"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data de início:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                  />
                  {purchaseDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Valor investido:</span>
                <input
                  type="number"
                  value={investmentValue}
                  onChange={(e) => setInvestmentValue(e.target.value)}
                  placeholder="R$ 0,00"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-32"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 for ATIVO flow - Quantidade e valores */}
        {step === 4 && currentFlow === "ativo" && (
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
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Data de compra:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none"
                  />
                  {purchaseDate && <Check className="w-4 h-4 text-pink-500" />}
                </div>
              </div>

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

        {/* Step 4 for SIMPLES flow - Confirmação */}
        {step === 4 && currentFlow === "simples" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Finalizar a adição da {getAssetTypeTitle()}.</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Observe os dados e confirme se estão corretamente preenchidos.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Form Title */}
            <h2 className="text-center text-foreground font-medium">
              Confirme seus dados
            </h2>

            {/* Confirmation Card */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div
                  className="w-1.5 h-8 rounded-full"
                  style={{ backgroundColor: tiposAtivos.find(t => t.id === selectedTipoAtivo)?.cor }}
                />
                <div>
                  <p className="text-pink-500 font-semibold">{selectedInstituicao.split(' ')[0]}</p>
                  <p className="text-foreground text-sm">{getAssetTypeTitle()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Data de início:</span>
                  <span className="font-medium text-foreground text-sm">
                    {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Conta com remuneração?:</span>
                  <span className="font-medium text-foreground text-sm">{hasRemuneration ? 'Sim' : 'Não'}</span>
                </div>
                {hasRemuneration && cdiPercentage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">% sobre o CDI:</span>
                    <span className="font-medium text-foreground text-sm">{cdiPercentage}%</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-foreground text-sm font-medium">Valor do investimento:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(parseFloat(investmentValue) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 for RENDA_FIXA flow - Valor do investimento */}
        {step === 4 && currentFlow === "renda_fixa" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Valor do investimento</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Informe o valor que você investiu neste título.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <FileEdit className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Valor investido:</span>
                <input
                  type="number"
                  value={investmentValue}
                  onChange={(e) => setInvestmentValue(e.target.value)}
                  placeholder="R$ 0,00"
                  step="0.01"
                  className="bg-transparent text-right text-muted-foreground text-sm border-none outline-none w-32"
                />
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Resumo:</p>
                <p className="text-sm"><strong>Indexador:</strong> {indexer}</p>
                <p className="text-sm"><strong>Taxa:</strong> {fixedRate}% a.a.</p>
                <p className="text-sm"><strong>Vencimento:</strong> {maturityDate ? new Date(maturityDate).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5 - Confirmação for ATIVO, RENDA_FIXA, CRIPTO and MOEDA flows */}
        {step === 5 && (currentFlow === "ativo" || currentFlow === "renda_fixa" || currentFlow === "cripto" || currentFlow === "moeda") && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Finalizar a adição.</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Observe os dados e confirme se estão corretamente preenchidos.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-center text-foreground font-medium">Confirme seus dados</h2>
            
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div
                  className="w-1.5 h-8 rounded-full"
                  style={{ backgroundColor: tiposAtivos.find(t => t.id === selectedTipoAtivo)?.cor }}
                />
                <div>
                  <p className="text-pink-500 font-semibold">
                    {currentFlow === "ativo" ? selectedAsset?.symbol : 
                     currentFlow === "cripto" ? selectedCripto :
                     currentFlow === "moeda" ? selectedMoeda :
                     selectedInstituicao.split(' ')[0]}
                  </p>
                  <p className="text-foreground text-sm">{getAssetTypeTitle()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Instituição</span>
                  <span className="font-medium text-foreground text-right text-sm">{selectedInstituicao}</span>
                </div>
                {currentFlow === "ativo" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Quantidade</span>
                      <span className="font-medium text-foreground">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Preço de compra</span>
                      <span className="font-medium text-foreground">{formatCurrency(parseFloat(purchasePrice) || 0)}</span>
                    </div>
                  </>
                )}
                {currentFlow === "renda_fixa" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Indexador</span>
                      <span className="font-medium text-foreground">{indexer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Taxa</span>
                      <span className="font-medium text-foreground">{fixedRate}% a.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Vencimento</span>
                      <span className="font-medium text-foreground">{maturityDate ? new Date(maturityDate).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                  </>
                )}
                {(currentFlow === "cripto" || currentFlow === "moeda") && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Data da compra</span>
                      <span className="font-medium text-foreground">{purchaseDate ? new Date(purchaseDate).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Cotação</span>
                      <span className="font-medium text-foreground">{formatCurrency(parseFloat(cotacao) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Quantidade</span>
                      <span className="font-medium text-foreground">{quantity}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">Total investido</span>
                  <span className="font-bold text-foreground text-lg">
                    {formatCurrency(
                      currentFlow === "ativo" 
                        ? (parseFloat(quantity) || 0) * (parseFloat(purchasePrice) || 0) + (parseFloat(brokerageFee) || 0)
                        : (currentFlow === "cripto" || currentFlow === "moeda")
                        ? (parseFloat(quantity) || 0) * (parseFloat(cotacao) || 0)
                        : parseFloat(investmentValue) || 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 for PERSONALIZADO flow - Confirmação */}
        {step === 4 && currentFlow === "personalizado" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-pink-500 font-semibold text-base mb-2">Finalizar a adição.</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Observe os dados e confirme se estão corretamente preenchidos.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-center text-foreground font-medium">Confirme seus dados</h2>
            
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div
                  className="w-1.5 h-8 rounded-full"
                  style={{ backgroundColor: tiposAtivos.find(t => t.id === selectedTipoAtivo)?.cor }}
                />
                <div>
                  <p className="text-pink-500 font-semibold">{customAssetName}</p>
                  <p className="text-foreground text-sm">{getAssetTypeTitle()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Instituição</span>
                  <span className="font-medium text-foreground text-right text-sm">{selectedInstituicao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Data de início</span>
                  <span className="font-medium text-foreground">{purchaseDate ? new Date(purchaseDate).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">Valor investido</span>
                  <span className="font-bold text-foreground text-lg">
                    {formatCurrency(parseFloat(investmentValue) || 0)}
                  </span>
                </div>
              </div>
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
            disabled={!canAdvance()}
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
