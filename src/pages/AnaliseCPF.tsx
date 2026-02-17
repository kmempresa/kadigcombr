import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ShieldCheck, ShieldAlert, Building2, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CPFResult {
  cpf: string;
  valid: boolean;
  status: string;
  statusLabel: string;
  pendencias: string[];
  consultedAt: string;
}

interface CNPJResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  situacao: string;
  data_abertura?: string | null;
  natureza_juridica?: string | null;
  porte?: string | null;
  atividade_principal?: string | null;
  error?: boolean;
}

function formatCPFInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCNPJInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default function AnaliseCPF() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [cpf, setCpf] = useState("");
  const [cnpjInputs, setCnpjInputs] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [cpfResult, setCpfResult] = useState<CPFResult | null>(null);
  const [cnpjResults, setCnpjResults] = useState<CNPJResult[]>([]);
  const [consulted, setConsulted] = useState(false);

  const themeClass = theme === "light" ? "light-theme" : "";

  const addCNPJField = () => setCnpjInputs(prev => [...prev, ""]);
  const removeCNPJField = (i: number) => setCnpjInputs(prev => prev.filter((_, idx) => idx !== i));
  const updateCNPJ = (i: number, val: string) => {
    setCnpjInputs(prev => prev.map((v, idx) => idx === i ? formatCNPJInput(val) : v));
  };

  const handleConsultar = async () => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      toast.error("Digite um CPF válido com 11 dígitos");
      return;
    }

    setLoading(true);
    setCpfResult(null);
    setCnpjResults([]);

    try {
      const cnpjs = cnpjInputs
        .map(c => c.replace(/\D/g, ''))
        .filter(c => c.length === 14);

      const { data, error } = await supabase.functions.invoke('cpf-analysis', {
        body: { cpf: cleanCPF, cnpjs }
      });

      if (error) throw error;

      setCpfResult(data.cpf);
      setCnpjResults(data.cnpjs || []);
      setConsulted(true);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao consultar CPF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${themeClass} min-h-screen bg-background flex flex-col`}>
      {/* Header - Kadig style */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Análise de CPF</h1>
            <p className="text-xs text-muted-foreground">Consulta na Receita Federal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full pb-24">
        {/* CPF Input Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Consultar CPF</h2>
              <p className="text-xs text-muted-foreground">Digite seu CPF para verificar a situação</p>
            </div>
          </div>
          <Input
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatCPFInput(e.target.value))}
            maxLength={14}
            className="h-12 rounded-2xl bg-muted/50 border-border/50 text-base"
          />
        </motion.div>

        {/* CNPJs Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">CNPJs Vinculados</h2>
              <p className="text-xs text-muted-foreground">Adicione os CNPJs que deseja consultar</p>
            </div>
          </div>
          <div className="space-y-2">
            {cnpjInputs.map((val, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="00.000.000/0000-00"
                  value={val}
                  onChange={e => updateCNPJ(i, e.target.value)}
                  maxLength={18}
                  className="flex-1 h-12 rounded-2xl bg-muted/50 border-border/50 text-base"
                />
                {cnpjInputs.length > 1 && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeCNPJField(i)}
                    className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </motion.button>
                )}
              </div>
            ))}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={addCNPJField}
              className="w-full h-10 rounded-2xl border border-dashed border-border/70 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar CNPJ
            </motion.button>
          </div>
        </motion.div>

        {/* Consultar Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button 
            onClick={handleConsultar} 
            disabled={loading} 
            className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/20"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Consultando...</>
            ) : (
              <><Search className="w-5 h-5 mr-2" /> Consultar CPF</>
            )}
          </Button>
        </motion.div>

        {/* Results */}
        {consulted && cpfResult && (
          <div className="space-y-4">
            {/* CPF Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border rounded-3xl p-5 space-y-4 ${cpfResult.valid ? "border-green-500/30" : "border-destructive/30"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cpfResult.valid ? "bg-green-500/20" : "bg-destructive/20"}`}>
                    {cpfResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">CPF {cpfResult.cpf}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cpfResult.consultedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge variant={cpfResult.valid ? "default" : "destructive"} className={cpfResult.valid ? "bg-green-500/20 text-green-600 border-green-500/30 dark:text-green-400" : ""}>
                  {cpfResult.statusLabel}
                </Badge>
              </div>

              {cpfResult.pendencias.length > 0 && (
                <div className="bg-destructive/10 rounded-2xl p-4 space-y-1.5">
                  <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Pendências encontradas
                  </p>
                  {cpfResult.pendencias.map((p, i) => (
                    <p key={i} className="text-xs text-destructive/80 pl-5">• {p}</p>
                  ))}
                </div>
              )}

              {cpfResult.valid && cpfResult.pendencias.length === 0 && (
                <div className="bg-green-500/10 rounded-2xl p-4">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Nenhuma pendência encontrada
                  </p>
                </div>
              )}
            </motion.div>

            {/* CNPJ Results */}
            {cnpjResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pt-2 pb-1">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                  <h2 className="font-bold text-foreground text-base">CNPJs Consultados</h2>
                  <span className="text-xs text-muted-foreground">({cnpjResults.length})</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                </div>
                {cnpjResults.map((cnpj, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-card border rounded-3xl p-5 space-y-3 ${cnpj.error ? "border-destructive/30" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-bold text-foreground">{cnpj.cnpj}</p>
                      <Badge variant={cnpj.error ? "destructive" : "outline"} className="text-xs">
                        {cnpj.situacao}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{cnpj.razao_social}</p>
                    {cnpj.nome_fantasia && (
                      <p className="text-xs text-muted-foreground">Nome Fantasia: {cnpj.nome_fantasia}</p>
                    )}
                    {!cnpj.error && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                        {cnpj.data_abertura && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Abertura</p>
                            <p className="text-xs font-medium text-foreground">{cnpj.data_abertura}</p>
                          </div>
                        )}
                        {cnpj.porte && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Porte</p>
                            <p className="text-xs font-medium text-foreground">{cnpj.porte}</p>
                          </div>
                        )}
                        {cnpj.natureza_juridica && (
                          <div className="col-span-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Natureza Jurídica</p>
                            <p className="text-xs font-medium text-foreground">{cnpj.natureza_juridica}</p>
                          </div>
                        )}
                        {cnpj.atividade_principal && (
                          <div className="col-span-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atividade Principal</p>
                            <p className="text-xs font-medium text-foreground">{cnpj.atividade_principal}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
