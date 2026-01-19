import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PluggyConnect } from "react-pluggy-connect";
import { 
  Link2, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Building2, 
  Wallet,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PluggyItem {
  id: string;
  connector: {
    id: number;
    name: string;
    institutionUrl: string;
    imageUrl: string;
    primaryColor: string;
    type: string;
  };
  status: string;
  executionStatus: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
}

interface ConexoesTabProps {
  onImportInvestments?: (investments: any[]) => void;
}

export default function ConexoesTab({ onImportInvestments }: ConexoesTabProps) {
  const [items, setItems] = useState<PluggyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PluggyItem | null>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('pluggy', {
        body: { action: 'list-items' }
      });

      if (error) throw error;
      setItems(data?.results || []);
    } catch (err: any) {
      console.error('Error fetching items:', err);
      toast.error('Erro ao carregar conexões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke('pluggy', {
        body: { action: 'create-connect-token' }
      });

      if (error) throw error;
      
      setConnectToken(data.accessToken);
      setShowWidget(true);
    } catch (err: any) {
      console.error('Error creating connect token:', err);
      toast.error('Erro ao iniciar conexão');
    } finally {
      setConnecting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.functions.invoke('pluggy', {
        body: { action: 'delete-item', itemId }
      });

      if (error) throw error;
      
      toast.success('Conexão removida com sucesso');
      setDeletingItemId(null);
      fetchItems();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error('Erro ao remover conexão');
    }
  };

  const handleViewDetails = async (item: PluggyItem) => {
    setSelectedItem(item);
    setLoadingDetails(true);
    
    try {
      const [accountsRes, investmentsRes] = await Promise.all([
        supabase.functions.invoke('pluggy', {
          body: { action: 'get-accounts', itemId: item.id }
        }),
        supabase.functions.invoke('pluggy', {
          body: { action: 'get-investments', itemId: item.id }
        })
      ]);

      setItemDetails({
        accounts: accountsRes.data?.results || [],
        investments: investmentsRes.data?.results || []
      });
    } catch (err: any) {
      console.error('Error fetching details:', err);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPDATED':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'UPDATING':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'LOGIN_ERROR':
      case 'OUTDATED':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPDATED': return 'Atualizado';
      case 'UPDATING': return 'Atualizando...';
      case 'LOGIN_ERROR': return 'Erro de login';
      case 'OUTDATED': return 'Desatualizado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Conexões</h2>
          <p className="text-sm text-muted-foreground">Open Finance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Conectar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando conexões...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma conexão
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Conecte suas contas bancárias e corretoras para importar seus investimentos automaticamente.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium"
          >
            {connecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Conectar Conta
          </button>
        </motion.div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: item.connector?.primaryColor || '#E5E7EB' }}
                >
                  {item.connector?.imageUrl ? (
                    <img 
                      src={item.connector.imageUrl} 
                      alt={item.connector.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {item.connector?.name || 'Instituição'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(item.status)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusText(item.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {formatDate(item.lastUpdatedAt || item.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeletingItemId(item.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Open Finance</h4>
            <p className="text-sm text-muted-foreground">
              Suas conexões são seguras e protegidas pelo Banco Central. 
              Você pode revogar o acesso a qualquer momento.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pluggy Connect Widget */}
      {showWidget && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          onSuccess={(itemData) => {
            console.log("Pluggy connection successful:", itemData);
            toast.success(`${itemData.item?.connector?.name || 'Instituição'} conectada com sucesso!`);
            setShowWidget(false);
            setConnectToken(null);
            fetchItems();
          }}
          onError={(error) => {
            console.error("Pluggy connection error:", error);
            toast.error(error?.message || "Erro ao conectar instituição");
          }}
          onClose={() => {
            setShowWidget(false);
            setConnectToken(null);
            fetchItems();
          }}
          onEvent={(event) => {
            console.log("Pluggy event:", event);
          }}
        />
      )}

      {/* Details Drawer */}
      <Drawer open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-3">
              {selectedItem?.connector?.imageUrl && (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedItem.connector.primaryColor }}
                >
                  <img 
                    src={selectedItem.connector.imageUrl} 
                    alt={selectedItem.connector.name}
                    className="w-6 h-6 object-contain"
                  />
                </div>
              )}
              {selectedItem?.connector?.name || 'Detalhes'}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            {loadingDetails ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {/* Accounts */}
                {itemDetails?.accounts?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Contas ({itemDetails.accounts.length})
                    </h4>
                    <div className="space-y-2">
                      {itemDetails.accounts.map((account: any) => (
                        <div key={account.id} className="bg-muted/50 rounded-xl p-3">
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.type}</p>
                          <p className="text-lg font-bold text-foreground mt-1">
                            R$ {account.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investments */}
                {itemDetails?.investments?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Investimentos ({itemDetails.investments.length})
                    </h4>
                    <div className="space-y-2">
                      {itemDetails.investments.map((inv: any) => (
                        <div key={inv.id} className="bg-muted/50 rounded-xl p-3">
                          <p className="font-medium text-foreground">{inv.name}</p>
                          <p className="text-sm text-muted-foreground">{inv.type}</p>
                          <p className="text-lg font-bold text-foreground mt-1">
                            R$ {inv.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!itemDetails?.accounts?.length && !itemDetails?.investments?.length) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado
                  </div>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desconectar a instituição e remover todos os dados importados.
              Você pode reconectar a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItemId && handleDeleteItem(deletingItemId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
