
import { create } from 'zustand';
import { getCompetitors, createCompetitor } from '../services/api';
import { useNotificationStore } from './notificationStore';

interface Competitor {
    id?: string;
    _id?: string;
    name: string;
    url: string;
    count?: number;
}

interface CompetitorState {
    competitors: Competitor[];
    loading: boolean;
    error: string | null;
    fetchCompetitors: () => Promise<void>;
    addCompetitor: (name: string, url: string) => Promise<Competitor | null>;
}

export const useCompetitorStore = create<CompetitorState>((set) => ({
    competitors: [],
    loading: false,
    error: null,
    fetchCompetitors: async () => {
        set({ loading: true });
        try {
            const data = await getCompetitors();
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
}));
