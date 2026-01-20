import { motion } from "framer-motion";
import { Building2, RefreshCw, Loader2, TrendingUp, ChevronRight } from "lucide-react";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";
import { usePluggySync } from "@/hooks/usePluggySync";

interface ConnectedBanksCardProps {
  investments: Array<{
    id: string;
    asset_name: string;
    current_value: number;
    source?: string;
  }>;
  showValues?: boolean;
  onViewConnections?: () => void;
}

export function ConnectedBanksCard({ 
  investments, 
  showValues = true,
  onViewConnections 
}: ConnectedBanksCardProps) {
  const { connections, loading } = useRealtimeConnections();
  const { syncing, syncAllConnections } = usePluggySync();
  
  // Calculate total from Pluggy investments
  const pluggyInvestments = investments.filter(inv => (inv as any).source === 'pluggy');
  const totalPluggyValue = pluggyInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Bancos Conectados</h3>
            <p className="text-xs text-muted-foreground">{connections.length} instituição(ões)</p>
          </div>
        </div>
        
        <motion.button
          onClick={() => syncAllConnections()}
          disabled={syncing}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      
      {/* Banks List */}
      <div className="divide-y divide-border/30">
        {connections.map((connection, index) => {
          // Calculate value for this connection (simplified - all pluggy investments)
          const connectionValue = index === 0 ? totalPluggyValue : 0;
          
          return (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-4 py-3 flex items-center gap-3"
            >
              {/* Bank Logo */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-md relative"
                style={{ 
                  backgroundColor: connection.connector_primary_color 
                    ? (connection.connector_primary_color.startsWith('#') 
                        ? connection.connector_primary_color 
                        : `#${connection.connector_primary_color}`)
                    : 'hsl(var(--muted))' 
                }}
              >
                {connection.connector_image_url && (
                  <img 
                    src={connection.connector_image_url} 
                    alt={connection.connector_name || 'Banco'} 
                    className="w-full h-full object-contain p-1.5 relative z-10"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {/* Fallback - first letter of bank name */}
                <span className="text-white font-bold text-sm absolute">
                  {(connection.connector_name || 'B').charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Bank Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {connection.connector_name || 'Instituição'}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    connection.status === 'UPDATED' ? 'bg-emerald-500' : 
                    connection.status === 'UPDATING' ? 'bg-blue-500 animate-pulse' : 
                    'bg-amber-500'
                  }`} />
                  <p className="text-xs text-muted-foreground">
                    {connection.status === 'UPDATED' ? 'Sincronizado' : 
                     connection.status === 'UPDATING' ? 'Atualizando...' : 
                     'Pendente'}
                  </p>
                </div>
              </div>
              
              {/* Value */}
              {showValues && connectionValue > 0 && (
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(connectionValue)}
                  </p>
                  <div className="flex items-center gap-0.5 justify-end">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500">Tempo real</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Footer - View All */}
      {onViewConnections && (
        <button
          onClick={onViewConnections}
          className="w-full px-4 py-3 border-t border-border/30 flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/5 transition-all"
        >
          <span>Ver todas as conexões</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
