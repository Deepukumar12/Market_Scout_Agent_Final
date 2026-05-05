import { create } from 'zustand';
import * as api from '@/services/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    read: boolean;
    competitorId?: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const data = await api.getNotifications();
            set({ 
                notifications: data, 
                unreadCount: data.filter((n: any) => !n.read).length,
                loading: false 
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ loading: false });
        }
    },

    addNotification: async () => {
        // This is usually triggered by backend, but kept for UI feedback if needed
        // In this architecture, we'll refetch instead to ensure sync
        await get().fetchNotifications();
    },

    markAsRead: async (id) => {
        // Optimistic update
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            return {
                notifications,
                unreadCount: notifications.filter((n) => !n.read).length,
            };
        });
        
        try {
            await api.markNotificationRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert on error? Or just skip for now.
        }
    },

    markAllAsRead: async () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
        
        try {
            await api.markAllNotificationsRead();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    },

    clearAll: async () => {
        set({ notifications: [], unreadCount: 0 });
        try {
            await api.clearNotifications();
        } catch (error) {
            console.error('Failed to clear notifications archive:', error);
        }
    },
}));
