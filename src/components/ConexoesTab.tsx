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

interface PluggyConnection {
  id: string;
  item_id: string;
  connector_id: number | null;
  connector_name: string | null;
  connector_image_url: string | null;
  connector_primary_color: string | null;
  status: string | null;
  last_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ConexoesTabProps {
  onImportInvestments?: (investments: any[]) => void;
}

export default function ConexoesTab({ onImportInvestments }: ConexoesTabProps) {
  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<PluggyConnection | null>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);

  // Fetch connections from local database
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pluggy_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (err: any) {
      console.error('Error fetching connections:', err);
      toast.error('Erro ao carregar conexões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

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

  // Save connection to database when widget succeeds
  const handleConnectionSuccess = async (itemData: any) => {
    console.log("Pluggy connection successful:", itemData);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const item = itemData.item;
      const connector = item?.connector;

      // Check if connection already exists
      const { data: existing } = await supabase
        .from('pluggy_connections')
        .select('id')
        .eq('item_id', item.id)
        .single();

      if (existing) {
        // Update existing connection
        await supabase
          .from('pluggy_connections')
          .update({
            connector_name: connector?.name,
            connector_image_url: connector?.imageUrl,
            connector_primary_color: connector?.primaryColor,
            status: item.status,
            last_updated_at: item.lastUpdatedAt || item.updatedAt,
          })
          .eq('id', existing.id);
      } else {
        // Insert new connection
        const { error: insertError } = await supabase
          .from('pluggy_connections')
          .insert({
            user_id: user.id,
            item_id: item.id,
            connector_id: connector?.id,
            connector_name: connector?.name,
            connector_image_url: connector?.imageUrl,
            connector_primary_color: connector?.primaryColor,
            status: item.status || 'PENDING',
            last_updated_at: item.lastUpdatedAt || item.updatedAt,
          });

        if (insertError) throw insertError;
      }

      toast.success(`${connector?.name || 'Instituição'} conectada com sucesso!`);
      fetchConnections();
    } catch (err: any) {
      console.error('Error saving connection:', err);
      toast.error('Erro ao salvar conexão');
    } finally {
      setShowWidget(false);
      setConnectToken(null);
    }
  };

  // Sync connection status from Pluggy API
  const handleSyncConnection = async (connection: PluggyConnection) => {
    try {
      setSyncingItemId(connection.item_id);
      
      const { data, error } = await supabase.functions.invoke('pluggy', {
        body: { action: 'get-item', itemId: connection.item_id }
      });

      if (error) throw error;

      // Update local database with fresh status
      await supabase
        .from('pluggy_connections')
        .update({
          status: data.status,
          last_updated_at: data.lastUpdatedAt || data.updatedAt,
        })
        .eq('id', connection.id);

      toast.success('Conexão sincronizada!');
      fetchConnections();
    } catch (err: any) {
      console.error('Error syncing connection:', err);
      toast.error('Erro ao sincronizar conexão');
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleDeleteConnection = async (connection: PluggyConnection) => {
    try {
      // Delete from Pluggy API
      await supabase.functions.invoke('pluggy', {
        body: { action: 'delete-item', itemId: connection.item_id }
      });

      // Delete from local database
      const { error } = await supabase
        .from('pluggy_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;
      
      toast.success('Conexão removida com sucesso');
      setDeletingConnectionId(null);
      fetchConnections();
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      toast.error('Erro ao remover conexão');
    }
  };

  const handleViewDetails = async (connection: PluggyConnection) => {
    setSelectedConnection(connection);
    setLoadingDetails(true);
    
    try {
      const [accountsRes, investmentsRes] = await Promise.all([
        supabase.functions.invoke('pluggy', {
          body: { action: 'get-accounts', itemId: connection.item_id }
        }),
        supabase.functions.invoke('pluggy', {
          body: { action: 'get-investments', itemId: connection.item_id }
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

  const getStatusIcon = (status: string | null) => {
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

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'UPDATED': return 'Atualizado';
      case 'UPDATING': return 'Atualizando...';
      case 'LOGIN_ERROR': return 'Erro de login';
      case 'OUTDATED': return 'Desatualizado';
      case 'PENDING': return 'Pendente';
      default: return status || 'Desconhecido';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 pb-24">
      {/* Header Premium - Kadig Style */}
      <header className="relative overflow-hidden pt-safe">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-4 pb-4 pt-2">
          <div className="flex items-center justify-between">
            {/* Left side - Title with icon */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Open Finance</span>
                <span className="font-bold text-lg text-foreground">Conexões</span>
              </div>
            </motion.div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1">
              <motion.button 
                onClick={fetchConnections}
                disabled={loading}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button 
                onClick={handleConnect}
                disabled={connecting}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/20"
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="text-sm">Conectar</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="px-4">

      {/* Loading */}
      {loading && connections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando conexões...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && connections.length === 0 && (
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

      {/* Connections List */}
      {connections.length > 0 && (
        <div className="space-y-3">
          {connections.map((connection, index) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: connection.connector_primary_color ? `#${connection.connector_primary_color}` : '#E5E7EB' }}
                >
                  {connection.connector_image_url ? (
                    <img 
                      src={connection.connector_image_url} 
                      alt={connection.connector_name || 'Instituição'}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {connection.connector_name || 'Instituição'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(connection.status)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusText(connection.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {formatDate(connection.last_updated_at || connection.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncConnection(connection)}
                    disabled={syncingItemId === connection.item_id}
                    className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${syncingItemId === connection.item_id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleViewDetails(connection)}
                    className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeletingConnectionId(connection.id)}
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
      </div>

      {/* Pluggy Connect Widget */}
      {showWidget && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          onSuccess={handleConnectionSuccess}
          onError={(error) => {
            console.error("Pluggy connection error:", error);
            toast.error(error?.message || "Erro ao conectar instituição");
          }}
          onClose={() => {
            setShowWidget(false);
            setConnectToken(null);
            fetchConnections();
          }}
          onEvent={(event) => {
            console.log("Pluggy event:", event);
          }}
        />
      )}

      {/* Details Drawer */}
      <Drawer open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-3">
              {selectedConnection?.connector_image_url && (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedConnection.connector_primary_color ? `#${selectedConnection.connector_primary_color}` : '#E5E7EB' }}
                >
                  <img 
                    src={selectedConnection.connector_image_url} 
                    alt={selectedConnection.connector_name || 'Instituição'}
                    className="w-6 h-6 object-contain"
                  />
                </div>
              )}
              {selectedConnection?.connector_name || 'Detalhes'}
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
      <AlertDialog open={!!deletingConnectionId} onOpenChange={() => setDeletingConnectionId(null)}>
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
              onClick={() => {
                const conn = connections.find(c => c.id === deletingConnectionId);
                if (conn) handleDeleteConnection(conn);
              }}
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
