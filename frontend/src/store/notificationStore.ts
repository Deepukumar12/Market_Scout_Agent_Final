
import { create } from 'zustand';

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
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [
        {
            id: '1',
            title: 'Agent Intelligence Live',
            message: 'Global surveillance network is now active and monitoring targets.',
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false,
        },
        {
            id: '2',
            title: 'Target Initialized',
            message: 'Autonomous agents have been deployed to monitor competitor signals.',
            type: 'info',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            read: false,
        }
    ],
    unreadCount: 2,

    addNotification: (noti) => {
        const newNoti: Notification = {
            ...noti,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            read: false,
        };
        set((state) => ({
            notifications: [newNoti, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },

    markAsRead: (id) => {
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            return {
                notifications,
                unreadCount: notifications.filter((n) => !n.read).length,
            };
        });
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}));
