import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ShieldCheck, ShieldAlert, Building2, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [cpf, setCpf] = useState("");
  const [cnpjInputs, setCnpjInputs] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [cpfResult, setCpfResult] = useState<CPFResult | null>(null);
  const [cnpjResults, setCnpjResults] = useState<CNPJResult[]>([]);
  const [consulted, setConsulted] = useState(false);

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">Análise de CPF</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        {/* CPF Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Consultar CPF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(formatCPFInput(e.target.value))}
                maxLength={14}
              />
            </div>
          </CardContent>
        </Card>

        {/* CNPJs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              CNPJs Vinculados
            </CardTitle>
            <p className="text-xs text-muted-foreground">Adicione os CNPJs que deseja consultar</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {cnpjInputs.map((val, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="00.000.000/0000-00"
                  value={val}
                  onChange={e => updateCNPJ(i, e.target.value)}
                  maxLength={18}
                  className="flex-1"
                />
                {cnpjInputs.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeCNPJField(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCNPJField} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Adicionar CNPJ
            </Button>
          </CardContent>
        </Card>

        {/* Consultar Button */}
        <Button onClick={handleConsultar} disabled={loading} className="w-full h-12 text-base font-semibold">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Consultando...</>
          ) : (
            <><Search className="w-5 h-5 mr-2" /> Consultar</>
          )}
        </Button>

        {/* Results */}
        {consulted && cpfResult && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* CPF Status */}
            <Card className={cpfResult.valid ? "border-green-500/30" : "border-destructive/30"}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cpfResult.valid ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-destructive" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">CPF {cpfResult.cpf}</p>
                      <p className="text-xs text-muted-foreground">
                        Consultado em {new Date(cpfResult.consultedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cpfResult.valid ? "default" : "destructive"} className={cpfResult.valid ? "bg-green-500/20 text-green-600 border-green-500/30" : ""}>
                    {cpfResult.statusLabel}
                  </Badge>
                </div>

                {cpfResult.pendencias.length > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pendências encontradas
                    </p>
                    {cpfResult.pendencias.map((p, i) => (
                      <p key={i} className="text-xs text-destructive/80">• {p}</p>
                    ))}
                  </div>
                )}

                {cpfResult.valid && cpfResult.pendencias.length === 0 && (
                  <div className="bg-green-500/10 rounded-lg p-3">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Nenhuma pendência encontrada
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CNPJ Results */}
            {cnpjResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  CNPJs Consultados ({cnpjResults.length})
                </h3>
                {cnpjResults.map((cnpj, i) => (
                  <Card key={i} className={cnpj.error ? "border-destructive/30" : ""}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-sm font-semibold">{cnpj.cnpj}</p>
                        <Badge variant={cnpj.error ? "destructive" : "outline"} className="text-xs">
                          {cnpj.situacao}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{cnpj.razao_social}</p>
                      {cnpj.nome_fantasia && (
                        <p className="text-xs text-muted-foreground">Nome Fantasia: {cnpj.nome_fantasia}</p>
                      )}
                      {!cnpj.error && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {cnpj.data_abertura && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Abertura</p>
                              <p className="text-xs">{cnpj.data_abertura}</p>
                            </div>
                          )}
                          {cnpj.porte && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Porte</p>
                              <p className="text-xs">{cnpj.porte}</p>
                            </div>
                          )}
                          {cnpj.natureza_juridica && (
                            <div className="col-span-2">
                              <p className="text-[10px] text-muted-foreground uppercase">Natureza Jurídica</p>
                              <p className="text-xs">{cnpj.natureza_juridica}</p>
                            </div>
                          )}
                          {cnpj.atividade_principal && (
                            <div className="col-span-2">
                              <p className="text-[10px] text-muted-foreground uppercase">Atividade Principal</p>
                              <p className="text-xs">{cnpj.atividade_principal}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
