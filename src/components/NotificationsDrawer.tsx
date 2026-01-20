import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Check, Trash2, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Notification } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Info className="w-5 h-5 text-primary" />;
  }
};

const getTypeBg = (type: string, read: boolean) => {
  if (read) return 'bg-muted/30';
  
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-l-2 border-l-green-500';
    case 'warning':
      return 'bg-yellow-500/10 border-l-2 border-l-yellow-500';
    case 'alert':
      return 'bg-red-500/10 border-l-2 border-l-red-500';
    default:
      return 'bg-primary/10 border-l-2 border-l-primary';
  }
};

export const NotificationsDrawer = ({
  isOpen,
  onClose,
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationsDrawerProps) => {
  const isMobile = useIsMobile();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - hidden on mobile for full screen effect */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={onClose}
            />
          )}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed right-0 top-0 h-full bg-background z-50 shadow-xl flex flex-col ${
              isMobile ? 'w-full' : 'w-full max-w-md'
            }`}
          >
            {/* Header with safe area for iOS */}
            <div className="flex items-center justify-between p-4 border-b border-border pt-safe"
              style={{ paddingTop: isMobile ? 'max(1rem, env(safe-area-inset-top))' : '1rem' }}
            >
              <div className="flex items-center gap-3">
                {isMobile ? (
                  <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                ) : null}
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Notificações</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!isMobile && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <button
                  onClick={onMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas como lidas
                </button>
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar tudo
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Nenhuma notificação
                  </h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Você será notificado sobre eventos importantes aqui
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 ${getTypeBg(notification.type, notification.read)} transition-colors`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                  title="Marcar como lida"
                                >
                                  <Check className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                              <button
                                onClick={() => onDelete(notification.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>
                          <span className="text-xs text-muted-foreground/50 mt-2 block">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
