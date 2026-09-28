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
  ChevronRight,
  Download,
  Zap,
  Banknote
} from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { usePluggySync } from "@/hooks/usePluggySync";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";
import { notifyConnectionAdded, notifyConnectionRemoved } from "@/lib/notifications";
import { getBankLogoInfo } from "@/lib/bankLogos";
import { BankLogo } from "@/components/BankLogo";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  theme?: "light" | "dark";
}

export default function ConexoesTab({ onImportInvestments, theme = "dark" }: ConexoesTabProps) {
  const [connecting, setConnecting] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<PluggyConnection | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [selectedPortfolioForImport, setSelectedPortfolioForImport] = useState<string>("");
  const [importingConnectionId, setImportingConnectionId] = useState<string | null>(null);
  
  const { portfolios, refreshPortfolios } = usePortfolio();
  const { syncing, syncAllConnections, syncConnection } = usePluggySync();
  
  // Use realtime connections hook
  const { connections, loading, refetch: fetchConnections } = useRealtimeConnections();

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

  // Save connection to database when widget succeeds and auto-sync investments
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
        .maybeSingle();

      let connectionId: string;

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
        connectionId = existing.id;
      } else {
        // Insert new connection
        const { data: newConnection, error: insertError } = await supabase
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
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        connectionId = newConnection.id;
      }

      toast.success(`${connector?.name || 'Instituição'} conectada com sucesso!`);
      
      // Create notification for connection
      await notifyConnectionAdded(connector?.name || 'Instituição');
      
      // Auto-sync investments after connection
      toast.loading('Sincronizando investimentos...', { id: 'sync-toast' });
      
      try {
        await syncAllConnections(false);
        toast.success('Investimentos sincronizados automaticamente!', { id: 'sync-toast' });
      } catch (syncErr) {
        console.error('Auto-sync failed:', syncErr);
        toast.error('Conexão salva, mas erro ao sincronizar investimentos', { id: 'sync-toast' });
      }
      
      fetchConnections();
      await refreshPortfolios();
    } catch (err: any) {
      console.error('Error saving connection:', err);
      toast.error('Erro ao salvar conexão');
    } finally {
      setShowWidget(false);
      setConnectToken(null);
    }
  };

  // Import investments from a specific connection to a portfolio
  const handleImportToPortfolio = async (connection: PluggyConnection) => {
    if (!selectedPortfolioForImport) {
      toast.error('Selecione uma carteira');
      return;
    }
    
    try {
      setImportingConnectionId(connection.id);
      await syncConnection(connection.id, selectedPortfolioForImport);
      setShowImportDrawer(false);
      setSelectedPortfolioForImport("");
      await refreshPortfolios();
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImportingConnectionId(null);
    }
  };

  // Sync connection status from Pluggy API
  const handleSyncConnection = async (connection: PluggyConnection) => {
    try {
      setSyncingItemId(connection.item_id);
      
      const { data, error } = await supabase.functions.invoke('pluggy', {
        body: { action: 'get-item', itemId: connection.item_id }
      });

      // Check if item no longer exists in Pluggy (404 error)
      if (error || data?.error?.includes('item not found') || data?.error?.includes('ITEM_NOT_FOUND')) {
        console.log('Item not found in Pluggy, removing local connection');
        
        // Remove the orphaned connection from local database
        await supabase
          .from('pluggy_connections')
          .delete()
          .eq('id', connection.id);
        
        toast.info('Conexão removida - não existe mais no banco');
        fetchConnections();
        return;
      }

      const connector = data.connector;

      // Update local database with fresh status and connector info
      await supabase
        .from('pluggy_connections')
        .update({
          status: data.status,
          last_updated_at: data.lastUpdatedAt || data.updatedAt,
          connector_name: connector?.name || connection.connector_name,
          connector_image_url: connector?.imageUrl || connection.connector_image_url,
          connector_primary_color: connector?.primaryColor || connection.connector_primary_color,
        })
        .eq('id', connection.id);

      toast.success('Conexão sincronizada!');
      fetchConnections();
    } catch (err: any) {
      console.error('Error syncing connection:', err);
      
      // Check for 404/item not found errors in the exception
      const errorMessage = err?.message || err?.toString() || '';
      if (errorMessage.includes('item not found') || errorMessage.includes('ITEM_NOT_FOUND') || errorMessage.includes('404')) {
        // Remove orphaned connection
        await supabase
          .from('pluggy_connections')
          .delete()
          .eq('id', connection.id);
        
        toast.info('Conexão removida - não existe mais no banco');
        fetchConnections();
        return;
      }
      
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

      // Get user to filter investments
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get all investments from this Pluggy connection (using item_id in pluggy_investment_id)
      const { data: pluggyInvestments } = await supabase
        .from('investments')
        .select('id, portfolio_id')
        .eq('user_id', user.id)
        .eq('source', 'pluggy');

      // Delete all investments that came from Pluggy for this user
      // Since we don't have a direct link, delete by source
      if (pluggyInvestments && pluggyInvestments.length > 0) {
        const portfolioIds = [...new Set(pluggyInvestments.map(inv => inv.portfolio_id))];
        
        const { error: deleteInvError } = await supabase
          .from('investments')
          .delete()
          .eq('user_id', user.id)
          .eq('source', 'pluggy');

        if (deleteInvError) {
          console.error('Error deleting investments:', deleteInvError);
        }

        // Update portfolio totals for affected portfolios
        for (const portfolioId of portfolioIds) {
          const { data: remainingInvestments } = await supabase
            .from('investments')
            .select('current_value, total_invested')
            .eq('portfolio_id', portfolioId);

          const totalValue = (remainingInvestments || []).reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
          const totalInvested = (remainingInvestments || []).reduce((sum, inv) => sum + Number(inv.total_invested || 0), 0);

          await supabase
            .from('portfolios')
            .update({
              total_value: totalValue,
              total_gain: totalValue - totalInvested,
            })
            .eq('id', portfolioId);
        }
      }

      // Delete connection from local database
      const { error } = await supabase
        .from('pluggy_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;
      
      // Create notification for disconnection
      await notifyConnectionRemoved(connection.connector_name || 'Instituição');
      
      toast.success('Conexão e investimentos removidos');
      setDeletingConnectionId(null);
      fetchConnections();
      
      // Refresh portfolios to update UI immediately
      await refreshPortfolios();
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      toast.error('Erro ao remover conexão');
    }
  };

  const handleViewDetails = async (connection: PluggyConnection) => {
    setSelectedConnection(connection);
    setShowDetailsDrawer(true);
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

      // Check if item no longer exists in Pluggy
      const hasItemNotFoundError = 
        accountsRes.data?.error?.includes('item not found') ||
        accountsRes.data?.error?.includes('ITEM_NOT_FOUND') ||
        investmentsRes.data?.error?.includes('item not found') ||
        investmentsRes.data?.error?.includes('ITEM_NOT_FOUND');

      if (hasItemNotFoundError) {
        // Remove orphaned connection
        await supabase
          .from('pluggy_connections')
          .delete()
          .eq('id', connection.id);
        
        toast.info('Conexão removida - não existe mais no banco');
        setShowDetailsDrawer(false);
        fetchConnections();
        return;
      }

      setItemDetails({
        accounts: accountsRes.data?.results || [],
        investments: investmentsRes.data?.results || []
      });
    } catch (err: any) {
      console.error('Error fetching details:', err);
      
      // Check for 404/item not found errors
      const errorMessage = err?.message || err?.toString() || '';
      if (errorMessage.includes('item not found') || errorMessage.includes('ITEM_NOT_FOUND') || errorMessage.includes('404')) {
        await supabase
          .from('pluggy_connections')
          .delete()
          .eq('id', connection.id);
        
        toast.info('Conexão removida - não existe mais no banco');
        setShowDetailsDrawer(false);
        fetchConnections();
        return;
      }
      
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'UPDATED':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'UPDATING':
        return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      case 'LOGIN_ERROR':
      case 'OUTDATED':
        return <AlertCircle className="w-4 h-4 text-warning" />;
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
    <div className={`min-h-full flex-1 bg-background text-foreground pb-24 ${theme === "light" ? "light-theme" : ""}`}>
      <header className="pt-safe border-b border-border">
        <div className="px-5 pt-3 pb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-primary">Open Finance</span>
            <h1 className="text-xl font-semibold text-foreground">Conexões</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {connections.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => syncAllConnections()} disabled={syncing} aria-label="Sincronizar todos os investimentos" title="Sincronizar todos os investimentos">
                <Zap className={`w-5 h-5 ${syncing ? 'animate-pulse' : ''}`} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={fetchConnections} disabled={loading} aria-label="Atualizar conexões" title="Atualizar conexões">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {connections.length > 0 && (
              <Button size="icon" onClick={handleConnect} disabled={connecting} aria-label="Conectar nova conta" title="Conectar nova conta">
                {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 pt-6">

      {/* Loading */}
      {loading && connections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando conexões...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && connections.length === 0 && (
        <section className="overflow-hidden rounded-lg bg-kadig-navy p-6 sm:p-8 text-kadig-white border border-primary/20">
          <div className="w-12 h-12 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center mb-6">
            <Building2 className="w-6 h-6 text-kadig-light" />
          </div>
          <h2 className="max-w-sm text-2xl font-semibold leading-tight">Conecte seus bancos em um só lugar</h2>
          <p className="mt-3 mb-7 max-w-sm text-sm leading-relaxed text-kadig-white/80">
            Conecte suas contas bancárias e corretoras para importar seus investimentos automaticamente.
          </p>
          <Button onClick={handleConnect} disabled={connecting} className="w-full h-12 bg-kadig-white text-kadig-navy hover:bg-kadig-white/90 font-semibold">
            {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Conectar primeira conta
          </Button>
        </section>
      )}

      {/* Connections List */}
      {connections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Contas conectadas</h2>
          {connections.map((connection, index) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                {/* Logo - Using BankLogo component for reliable logos */}
                <BankLogo
                  connectorName={connection.connector_name}
                  connectorImageUrl={connection.connector_image_url}
                  connectorPrimaryColor={connection.connector_primary_color}
                  size="md"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate text-sm">
                    {connection.connector_name || 'Instituição'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(connection.status)}
                      <span className="text-xs text-muted-foreground">
                        {getStatusText(connection.status)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/60">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(connection.last_updated_at || connection.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Actions - Mobile optimized */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon"
                    onClick={() => {
                      setSelectedConnection(connection);
                      setShowImportDrawer(true);
                    }}
                    className="h-9 w-9 text-primary" title="Importar" aria-label="Importar investimentos"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    onClick={() => handleSyncConnection(connection)}
                    disabled={syncingItemId === connection.item_id}
                    className="h-9 w-9" title="Sincronizar" aria-label="Sincronizar instituição"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingItemId === connection.item_id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon"
                    onClick={() => handleViewDetails(connection)}
                    className="h-9 w-9" title="Detalhes" aria-label="Ver detalhes da instituição"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    onClick={() => setDeletingConnectionId(connection.id)}
                    className="h-9 w-9 text-destructive hover:text-destructive" title="Remover" aria-label="Remover instituição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 border-t border-border pt-5">
        <ShieldCheck className="w-5 h-5 shrink-0 text-success" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          A conexão é realizada com seu consentimento pelo Open Finance. Você pode revogar o acesso a qualquer momento.
        </p>
      </div>
      </div>

      {/* Pluggy Connect Widget */}
      {showWidget && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          theme={theme}
          language="pt"
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
      <Drawer open={showDetailsDrawer} onOpenChange={(open) => {
        setShowDetailsDrawer(open);
        if (!open) setSelectedConnection(null);
      }}>
        <DrawerContent className={`max-h-[90vh] bg-background text-foreground ${theme === "light" ? "light-theme" : ""}`}>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-3">
              {selectedConnection && (
                <BankLogo
                  connectorName={selectedConnection.connector_name}
                  connectorImageUrl={selectedConnection.connector_image_url}
                  connectorPrimaryColor={selectedConnection.connector_primary_color}
                  size="sm"
                />
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
        <AlertDialogContent className={`bg-background text-foreground ${theme === "light" ? "light-theme" : ""}`}>
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
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import to Portfolio Drawer */}
      <Drawer open={showImportDrawer} onOpenChange={setShowImportDrawer}>
        <DrawerContent className={`max-h-[85vh] bg-background text-foreground ${theme === "light" ? "light-theme" : ""}`}>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              Importar Investimentos
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-6">
            {/* Connection Info */}
            {selectedConnection && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <BankLogo
                  connectorName={selectedConnection.connector_name}
                  connectorImageUrl={selectedConnection.connector_image_url}
                  connectorPrimaryColor={selectedConnection.connector_primary_color}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-foreground">{selectedConnection.connector_name}</p>
                  <p className="text-xs text-muted-foreground">Conexão selecionada</p>
                </div>
              </div>
            )}

            {/* Portfolio Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Selecione a carteira de destino
              </label>
              <Select 
                value={selectedPortfolioForImport} 
                onValueChange={setSelectedPortfolioForImport}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Os investimentos desta conexão serão sincronizados automaticamente com a carteira selecionada. 
                Alterações futuras no banco serão refletidas na carteira em tempo real.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary"
                onClick={() => {
                  setShowImportDrawer(false);
                  setSelectedPortfolioForImport("");
                }}
                className="flex-1 h-12"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => selectedConnection && handleImportToPortfolio(selectedConnection)}
                disabled={!selectedPortfolioForImport || importingConnectionId === selectedConnection?.id}
                className="flex-1 h-12"
              >
                {importingConnectionId === selectedConnection?.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
