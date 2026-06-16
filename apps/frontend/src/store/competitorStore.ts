
import { create } from 'zustand';
import { getCompetitors, createCompetitor } from '../services/api';
import { useNotificationStore } from './notificationStore';

interface Competitor {
    id?: string;
    _id?: string;
    name: string;
    url: string;
    status?: string;
    last_scan?: string;
    firmographics?: {
        logo?: string;
        industry?: string;
        location?: string;
        employees?: number;
        market_cap?: string;
    };
    count?: number;
    total_sources_scanned_cumulative?: number;
    total_updates_cumulative?: number;
    confidence_score?: number;
    risk_score?: number;
}

interface CompetitorState {
    competitors: Competitor[];
    selectedCompetitorId: string | null;
    loading: boolean;
    error: string | null;
    fetchCompetitors: (query?: string) => Promise<void>;
    setSelectedCompetitorId: (id: string | null) => void;
    addCompetitor: (name: string, url: string) => Promise<Competitor | null>;
    removeCompetitor: (id: string) => Promise<void>;
}

export const useCompetitorStore = create<CompetitorState>((set, get) => ({
    competitors: [],
    selectedCompetitorId: null,
    loading: false,
    error: null,
    setSelectedCompetitorId: (id) => {
        set({ selectedCompetitorId: id });
        window.dispatchEvent(new CustomEvent('intelligence-refresh'));
    },
    fetchCompetitors: async (query?: string) => {
        if (get().loading) return; // Prevent duplicate parallel requests that cause Axios to abort
        set({ loading: true, error: null });
        try {
            const data = await getCompetitors(query);
            const formattedData = (data || []).map((c: any) => ({
                ...c,
                id: c.id || c._id
            }));
            
            let currentSelected = get().selectedCompetitorId;
            const exists = formattedData.some((c: any) => c.id === currentSelected);
            if (!currentSelected || !exists) {
                currentSelected = formattedData.length > 0 ? formattedData[0].id : null;
            }
            
            set({ competitors: formattedData, selectedCompetitorId: currentSelected, loading: false });
        } catch (err) {
            set({ error: 'Failed to fetch competitors', loading: false });
        }
    },
    addCompetitor: async (name: string, url: string) => {
        const { addNotification } = useNotificationStore.getState();
        try {
            const newOne = await createCompetitor({
                name,
                url,
                monitoring_enabled: true,
                scan_frequency: 'Daily',
            });
            const newOneFormatted = { ...newOne, id: newOne.id || newOne._id };
            
            set((state) => {
                const updated = [...state.competitors, newOneFormatted];
                const currentSelected = state.selectedCompetitorId || newOneFormatted.id;
                return {
                    competitors: updated,
                    selectedCompetitorId: currentSelected
                };
            });

            addNotification({
                title: 'Target Acquired',
                message: `${name} has been added to surveillance network. Initial scan scheduled.`,
                type: 'success'
            });

            // Broadcast real-time refresh to all listeners
            window.dispatchEvent(new CustomEvent('intelligence-refresh'));

            return newOneFormatted;
        } catch (err) {
            console.error(err);

            addNotification({
                title: 'Deployment Failed',
                message: `Could not initialize monitoring for ${name}.`,
                type: 'error'
            });

            return null;
        }
    },
    removeCompetitor: async (id: string) => {
        const { addNotification } = useNotificationStore.getState();
        const { deleteCompetitor } = await import('../services/api');
        try {
            await deleteCompetitor(id);
            const remaining = get().competitors.filter((c) => (c.id || c._id) !== id);
            
            let currentSelected = get().selectedCompetitorId;
            if (currentSelected === id) {
                currentSelected = remaining.length > 0 ? (remaining[0].id || remaining[0]._id || null) : null;
            }
            
            set({
                competitors: remaining,
                selectedCompetitorId: currentSelected
            });
            
            addNotification({
                title: 'Competitor Terminated',
                message: 'Target has been removed from the surveillance network.',
                type: 'info'
            });
            
            // Broadcast refresh so all pages switch context immediately
            window.dispatchEvent(new CustomEvent('intelligence-refresh'));
        } catch (err) {
            console.error(err);
            addNotification({
                title: 'Termination Failed',
                message: 'Failed to remove competitor.',
                type: 'error'
            });
        }
    },
}));
