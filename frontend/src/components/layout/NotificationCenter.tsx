
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { Bell, X, Check, Info, AlertTriangle, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { markAsRead } = useNotificationStore();

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <X className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative p-4 rounded-2xl border transition-all duration-300 group cursor-pointer",
        notification.read 
          ? "bg-white/2 border-white/5 opacity-60" 
          : "bg-white/5 border-white/10 hover:border-blue-500/30 shadow-lg shadow-blue-500/5"
      )}
      onClick={() => markAsRead(notification.id)}
    >
      <div className="flex gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border",
          notification.read ? "bg-white/5 border-white/5" : "bg-blue-500/10 border-blue-500/20"
        )}>
          {getIcon()}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className={cn("text-xs font-bold uppercase tracking-wider", notification.read ? "text-slate-500" : "text-slate-200")}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
              <Clock className="w-3 h-3" />
              {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pr-4">
            {notification.message}
          </p>
        </div>
      </div>
      {!notification.read && (
        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
    </motion.div>
  );
};

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-[#020617] border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Intelligence Alerts</h2>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{unreadCount} UNREAD SIGNALS</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/5">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <Bell className="w-12 h-12 text-slate-700" />
                  <div>
                    <p className="text-sm font-bold text-white">Quiet Horizon</p>
                    <p className="text-xs text-slate-500">No new surveillance signals detected in this cycle.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-white/[0.02] grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={markAllAsRead}
                  className="bg-transparent border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5"
                >
                  <Check className="w-3 h-3 mr-2" /> Mark All Read
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={clearAll}
                  className="text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest"
                >
                  Clear Archive
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
