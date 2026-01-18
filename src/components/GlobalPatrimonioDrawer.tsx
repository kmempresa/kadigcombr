import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Globe, Trash2, Edit, ChevronDown, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GlobalAsset {
  id: string;
  name: string;
  category: string;
  currency: string;
  original_value: number;
  value_brl: number;
  exchange_rate: number;
  notes: string | null;
}

interface GlobalPatrimonioDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showValues: boolean;
}

const CURRENCIES = [
  { code: "BRL", name: "Real Brasileiro", symbol: "R$" },
  { code: "USD", name: "Dólar Americano", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Libra Esterlina", symbol: "£" },
  { code: "CHF", name: "Franco Suíço", symbol: "CHF" },
  { code: "JPY", name: "Iene Japonês", symbol: "¥" },
  { code: "CAD", name: "Dólar Canadense", symbol: "C$" },
  { code: "AUD", name: "Dólar Australiano", symbol: "A$" },
  { code: "CNY", name: "Yuan Chinês", symbol: "¥" },
];

const CATEGORIES = [
  { id: "imoveis", name: "Imóveis", icon: "🏠" },
  { id: "veiculos", name: "Veículos", icon: "🚗" },
  { id: "empresas", name: "Empresas/Negócios", icon: "🏢" },
  { id: "joias", name: "Joias/Metais Preciosos", icon: "💎" },
  { id: "arte", name: "Arte/Colecionáveis", icon: "🎨" },
  { id: "cripto", name: "Criptomoedas", icon: "₿" },
  { id: "poupanca", name: "Poupança/Conta Corrente", icon: "💰" },
  { id: "outros", name: "Outros", icon: "📦" },
];

const GlobalPatrimonioDrawer = ({
  open,
  onOpenChange,
  showValues,
}: GlobalPatrimonioDrawerProps) => {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  
  const [assets, setAssets] = useState<GlobalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<GlobalAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("outros");
  const [formCurrency, setFormCurrency] = useState("BRL");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    setLoadingRates(true);
    try {
      // Using a free exchange rate API
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/BRL"
      );
      if (response.ok) {
        const data = await response.json();
        // Convert rates to BRL (invert since API gives BRL as base)
        const rates: Record<string, number> = { BRL: 1 };
        for (const [currency, rate] of Object.entries(data.rates)) {
          rates[currency] = 1 / (rate as number);
        }
        setExchangeRates(rates);
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      // Fallback rates
      setExchangeRates({
        BRL: 1,
        USD: 5.0,
        EUR: 5.5,
        GBP: 6.3,
        CHF: 5.7,
        JPY: 0.033,
        CAD: 3.7,
        AUD: 3.3,
        CNY: 0.69,
      });
    } finally {
      setLoadingRates(false);
    }
  };

  // Fetch assets
  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("global_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching global assets:", error);
      toast.error("Erro ao carregar patrimônio global");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAssets();
      fetchExchangeRates();
    }
  }, [open]);

  const resetForm = () => {
    setFormName("");
    setFormCategory("outros");
    setFormCurrency("BRL");
    setFormValue("");
    setFormNotes("");
    setEditingAsset(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditClick = (asset: GlobalAsset) => {
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormCurrency(asset.currency);
    setFormValue(asset.original_value.toString());
    setFormNotes(asset.notes || "");
    setEditingAsset(asset);
    setShowAddForm(true);
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from("global_assets")
        .delete()
        .eq("id", assetId);

      if (error) throw error;
      
      toast.success("Patrimônio excluído!");
      fetchAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Erro ao excluir patrimônio");
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !formValue) {
      toast.error("Preencha nome e valor");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsSaving(true);
    try {
      const originalValue = parseFloat(formValue.replace(/[^\d.,]/g, "").replace(",", "."));
      const rate = exchangeRates[formCurrency] || 1;
      const valueBrl = originalValue * rate;

      const assetData = {
        name: formName.trim(),
        category: formCategory,
        currency: formCurrency,
        original_value: originalValue,
        value_brl: valueBrl,
        exchange_rate: rate,
        notes: formNotes.trim() || null,
        user_id: session.user.id,
      };

      if (editingAsset) {
        const { error } = await supabase
          .from("global_assets")
          .update(assetData)
          .eq("id", editingAsset.id);

        if (error) throw error;
        toast.success("Patrimônio atualizado!");
      } else {
        const { error } = await supabase
          .from("global_assets")
          .insert([assetData]);

        if (error) throw error;
        toast.success("Patrimônio adicionado!");
      }

      setShowAddForm(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error("Erro ao salvar patrimônio");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number, currency = "BRL") => {
    if (!showValues) return "•••••";
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    return `${currencyInfo?.symbol || ""} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const totalPatrimonioGlobal = assets.reduce((sum, asset) => sum + asset.value_brl, 0);

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`${themeClass} bg-muted max-h-[90vh]`}>
        <DrawerHeader className="border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <DrawerTitle className="font-semibold text-foreground">
              Patrimônio Global
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total em Reais</span>
              {loadingRates && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalPatrimonioGlobal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cotações atualizadas automaticamente
            </p>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddClick}
            className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 border border-border shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="flex-1 text-left font-medium text-foreground">
              Adicionar patrimônio
            </span>
          </button>

          {/* Assets List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
              <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhum patrimônio global cadastrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione imóveis, veículos, empresas e outros bens
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => {
                const category = getCategoryInfo(asset.category);
                return (
                  <div
                    key={asset.id}
                    className="bg-card rounded-2xl p-4 border border-border shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{asset.name}</h4>
                        <p className="text-xs text-muted-foreground">{category.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(asset)}
                          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Valor original:</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(asset.original_value, asset.currency)}
                        </span>
                      </div>
                      {asset.currency !== "BRL" && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Valor em R$:</span>
                          <span className="font-medium text-primary">
                            {formatCurrency(asset.value_brl)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-4 flex justify-center border-t border-border bg-muted">
          <DrawerClose asChild>
            <button className="w-12 h-12 rounded-full bg-muted-foreground/30 flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </div>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 z-50"
              onClick={() => setShowAddForm(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto"
              >
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-center text-foreground">
                    {editingAsset ? "Editar Patrimônio" : "Adicionar Patrimônio"}
                  </h3>

                  {/* Name */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Nome do patrimônio
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Apartamento Centro"
                      className="w-full bg-muted rounded-xl p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Categoria
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setFormCategory(cat.id)}
                          className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                            formCategory === cat.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-[10px] font-medium truncate w-full text-center">
                            {cat.name.split("/")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Moeda
                    </label>
                    <div className="relative">
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className="w-full bg-muted rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-primary appearance-none"
                      >
                        {CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.symbol} - {curr.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                    {formCurrency !== "BRL" && exchangeRates[formCurrency] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cotação atual: 1 {formCurrency} = R$ {exchangeRates[formCurrency]?.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Value */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Valor
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-muted rounded-xl p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                    />
                    {formValue && formCurrency !== "BRL" && exchangeRates[formCurrency] && (
                      <p className="text-sm text-primary mt-1 font-medium">
                        ≈ R$ {(parseFloat(formValue.replace(",", ".") || "0") * exchangeRates[formCurrency]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Detalhes adicionais..."
                      rows={2}
                      className="w-full bg-muted rounded-xl p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      className="flex-1 bg-muted text-foreground rounded-xl p-3 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-primary text-primary-foreground rounded-xl p-3 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingAsset ? "Salvar" : "Adicionar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
};

export default GlobalPatrimonioDrawer;
