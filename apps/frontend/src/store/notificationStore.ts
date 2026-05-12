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
    closeWebSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    socket: null as WebSocket | null,

    initWebSocket: () => {
        const { socket } = get();
        if (socket?.readyState === WebSocket.OPEN) return;

        const token = localStorage.getItem('scoutiq_token'); // Standardized token key
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Correct path as per main.py and api.py inclusion
        const wsUrl = `${protocol}//${window.location.host.replace(':5173', ':8000')}/ws/notifications?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'USER_UPDATE') {
                    window.dispatchEvent(new CustomEvent('user-protocol-sync', { detail: data.user }));
                    return;
                }

                if (data.type === 'SYSTEM') return; // Handshake info

                // Add to list and update unread
                set((state) => {
                    const newNotification = {
                        id: data.id || Math.random().toString(36).substr(2, 9),
                        title: data.title,
                        message: data.message,
                        type: (data.type || 'info').toLowerCase(),
                        timestamp: data.timestamp,
                        read: false,
                        competitorId: data.competitorId
                    };

                    const updatedNotifications = [newNotification, ...state.notifications];
                    
                    // Trigger dynamic dashboard refresh if a scan completed
                    if (data.title?.toLowerCase().includes('complete') || data.title?.toLowerCase().includes('intelligence')) {
                        window.dispatchEvent(new CustomEvent('intelligence-refresh'));
                    }
                    
                    return {
                        notifications: updatedNotifications,
                        unreadCount: updatedNotifications.filter(n => !n.read).length
                    };
                });
            } catch (err) {
                console.error('WS Message Parse Error:', err);
            }
        };

        ws.onclose = () => {
            set({ socket: null });
            // Reconnect after delay
            setTimeout(() => get().initWebSocket(), 5000);
        };

        set({ socket: ws });
    },

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const data = await api.getNotifications();
            const formattedData = data.map((n: any) => ({
                ...n,
                id: n.id || n._id || Math.random().toString(36).substr(2, 9)
            }));
            set({
                notifications: formattedData,
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

    closeWebSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.onclose = null; // Prevent auto-reconnect
            
            if (socket.readyState === WebSocket.CONNECTING) {
                // If still connecting, wait for open then close to avoid race condition
                socket.onopen = () => socket.close();
            } else if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            
            set({ socket: null });
        }
    }
}));
