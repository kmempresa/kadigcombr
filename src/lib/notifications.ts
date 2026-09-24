import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  category?: string;
  data?: Record<string, any>;
}

export const createNotification = async ({
  title,
  message,
  type = 'info',
  category = 'system',
  data = {},
}: CreateNotificationParams) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: session.user.id,
        title,
        message,
        type,
        category,
        data,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

// Pre-built notification types
export const notifyInvestmentAdded = (assetName: string, portfolioName: string, value: number) => {
  return createNotification({
    title: 'Investimento adicionado',
    message: `${assetName} foi adicionado à carteira "${portfolioName}" com valor de R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    type: 'success',
    category: 'investment',
    data: { assetName, portfolioName, value },
  });
};

export const notifyInvestmentDeleted = (assetName: string, count?: number) => {
  const message = count && count > 1 
    ? `${count} ativos foram excluídos da sua carteira`
    : `${assetName} foi removido da sua carteira`;
  
  return createNotification({
    title: 'Investimento excluído',
    message,
    type: 'warning',
    category: 'investment',
    data: { assetName, count },
  });
};

export const notifyConnectionAdded = (bankName: string) => {
  return createNotification({
    title: 'Conta conectada',
    message: `Sua conta do ${bankName} foi conectada com sucesso via Open Finance`,
    type: 'success',
    category: 'connection',
    data: { bankName },
  });
};

export const notifyConnectionRemoved = (bankName: string) => {
  return createNotification({
    title: 'Conta desconectada',
    message: `A conexão com ${bankName} foi removida`,
    type: 'info',
    category: 'connection',
    data: { bankName },
  });
};

export const notifyConnectionSynced = (bankName: string, created: number, updated: number) => {
  return createNotification({
    title: 'Sincronização concluída',
    message: `${bankName}: ${created} novo(s), ${updated} atualizado(s)`,
    type: 'success',
    category: 'sync',
    data: { bankName, created, updated },
  });
};
