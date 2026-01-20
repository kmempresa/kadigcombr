import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useRealtimeConnections() {
  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConnections([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pluggy_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pluggy-connections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pluggy_connections',
        },
        (payload) => {
          console.log('[useRealtimeConnections] Change:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newConn = payload.new as PluggyConnection;
            setConnections(prev => [newConn, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as PluggyConnection;
            setConnections(prev => 
              prev.map(c => c.id === updated.id ? updated : c)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setConnections(prev => prev.filter(c => c.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConnections]);

  return {
    connections,
    loading,
    refetch: fetchConnections,
  };
}
