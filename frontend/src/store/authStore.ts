
import { create } from 'zustand';
import api, { login, register, getCurrentUser } from '../services/api';

interface AuthState {
    user: any | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    initialize: () => void;
    fetchUser: () => Promise<void>;
}

// Simple JWT decoder for client-side use
function parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        window
            .atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    return JSON.parse(jsonPayload);
}

function isTokenExpired(token: string): boolean {
    try {
        const decoded: any = parseJwt(token);
        if (!decoded.exp) return false;
        const expiresAtMs = decoded.exp * 1000;
        return Date.now() >= expiresAtMs;
    } catch {
        return true;
    }
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: localStorage.getItem('scoutiq_token'),
    loading: false,
    error: null,

    initialize: () => {
        const token = localStorage.getItem('scoutiq_token');
        if (token) {
            if (isTokenExpired(token)) {
                localStorage.removeItem('scoutiq_token');
                set({ token: null, user: null });
                return;
            }

            try {
                const decoded = parseJwt(token);
                // Set initial state from token
                set({ user: decoded, token });
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Fetch fresh user data from backend
                get().fetchUser();
            } catch (e) {
                localStorage.removeItem('scoutiq_token');
                set({ token: null, user: null });
            }
        }
    },

    fetchUser: async () => {
        try {
            const userData = await getCurrentUser();
            set({ user: userData });
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            // Optionally logout if 401?
        }
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await login(email, password);
            const token = response.access_token;

            if (!token || isTokenExpired(token)) {
                throw new Error('Received invalid or expired token');
            }

            localStorage.setItem('scoutiq_token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const decoded = parseJwt(token);
            set({ user: decoded, token, loading: false });
        } catch (err: any) {
            console.error("Login error:", err);
            let errorMessage = 'Authentication failed';
            if (err.response && err.response.data && err.response.data.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // Pydantic validation errors often return an array of objects
                    errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
                } else {
                    errorMessage = JSON.stringify(err.response.data.detail);
                }
            }
            set({
                error: errorMessage,
                loading: false
            });
        }
    },

    register: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await register(data);
            const token = response.access_token;

            if (!token || isTokenExpired(token)) {
                throw new Error('Received invalid or expired token');
            }

            localStorage.setItem('scoutiq_token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const decoded = parseJwt(token);
            set({ user: decoded, token, loading: false });
        } catch (err: any) {
            console.error("Register error:", err);
            let errorMessage = 'Registration failed';
            if (err.response && err.response.data && err.response.data.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // Pydantic validation errors often return an array of objects
                    errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
                } else {
                    errorMessage = JSON.stringify(err.response.data.detail);
                }
            }
            set({
                error: errorMessage,
                loading: false
            });
        }
    },

    logout: () => {
        localStorage.removeItem('scoutiq_token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null });
    }
}));

