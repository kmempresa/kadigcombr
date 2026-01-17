import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const AdicionarCarteira = () => {
  const navigate = useNavigate();
  const [portfolioName, setPortfolioName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!portfolioName.trim()) {
      toast.error("Por favor, insira um nome para a carteira");
      return;
    }

    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    setLoading(true);
    try {
      // Create the new portfolio
      const { data: newPortfolio, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: userId,
          name: portfolioName.trim(),
          total_value: 0,
          total_gain: 0,
          cdi_percent: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Carteira criada com sucesso!");
      navigate("/app");
    } catch (error: any) {
      console.error("Error creating portfolio:", error);
      toast.error("Erro ao criar carteira: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-border relative">
        <button
          onClick={handleCancel}
          className="absolute left-4 w-8 h-8 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Adicionar carteira</h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Portfolio Name */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <label className="text-sm text-muted-foreground mb-2 block">
            Nome da carteira:
          </label>
          <Input
            type="text"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            placeholder="Ex: Investimentos, Reserva, etc."
            className="bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 p-0 h-auto text-base focus-visible:ring-0"
          />
        </div>

        {/* Primary Portfolio Toggle */}
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
          <span className="text-foreground">
            Esta será a sua carteira principal?
          </span>
          <Switch
            checked={isPrimary}
            onCheckedChange={setIsPrimary}
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 rounded-2xl bg-muted flex items-center justify-center gap-2 text-foreground font-medium"
          >
            <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </div>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !portfolioName.trim()}
            className="flex-1 py-4 rounded-2xl bg-muted flex items-center justify-center gap-2 text-foreground font-medium disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
            {loading ? "Criando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdicionarCarteira;
