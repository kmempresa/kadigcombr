import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X, Search, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstituicao, setSelectedInstituicao] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const totalSteps = 4;

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

  const filteredInstituicoes = useMemo(() => {
    if (!searchTerm.trim()) return instituicoesFinanceiras;
    return instituicoesFinanceiras.filter(inst =>
      inst.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const canAdvance = step === 1 ? selectedInstituicao !== "" : true;

  const handleAdvance = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - navigate back
      navigate("/app");
    }
  };

  const handleCancel = () => {
    navigate("/app");
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
          <h1 className="text-lg font-semibold text-foreground">Adicionar Ação</h1>
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
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Buscar nova instituição
            </h2>

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

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Informações do ativo
            </h2>
            <p className="text-center text-sm text-muted-foreground">
              Instituição selecionada: <strong>{selectedInstituicao}</strong>
            </p>
            {/* Step 2 content will be added later */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground">Próxima etapa: informações do ativo</p>
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
              Valores e quantidades
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground">Próxima etapa: valores</p>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-center text-muted-foreground font-medium">
              Confirmação
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground">Confirme os dados</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 h-14 bg-card border border-border rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-foreground font-medium">Cancelar</span>
          </button>

          <button
            onClick={handleAdvance}
            disabled={!canAdvance}
            className="flex-1 h-14 bg-card border border-border rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <span className="text-foreground font-medium">Avançar</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AdicionarInvestimento;
