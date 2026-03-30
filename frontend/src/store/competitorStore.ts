
import { create } from 'zustand';
import { getCompetitors, createCompetitor } from '../services/api';
import { useNotificationStore } from './notificationStore';

interface Competitor {
    id?: string;
    _id?: string;
    name: string;
    url: string;
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
    setSelectedCompetitorId: (id) => set({ selectedCompetitorId: id }),
    fetchCompetitors: async (query?: string) => {
        if (get().loading) return; // Prevent duplicate parallel requests that cause Axios to abort
        set({ loading: true, error: null });
        try {
            const data = await getCompetitors(query);
            set({ competitors: data || [], loading: false });
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
            set((state) => ({ competitors: [...state.competitors, newOne] }));

            addNotification({
                title: 'Target Acquired',
                message: `${name} has been added to surveillance network. Initial scan scheduled.`,
                type: 'success'
            });

            return newOne;
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
            set((state) => ({
                competitors: state.competitors.filter((c) => (c.id || c._id) !== id)
            }));
            addNotification({
                title: 'Competitor Terminated',
                message: 'Target has been removed from the surveillance network.',
                type: 'info'
            });
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
