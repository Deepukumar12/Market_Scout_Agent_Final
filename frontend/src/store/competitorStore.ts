
import { create } from 'zustand';
import { getCompetitors, createCompetitor } from '../services/api';

interface Competitor {
    id: string;
    name: string;
    url: string;
    count: number;
}

interface CompetitorState {
    competitors: Competitor[];
    loading: boolean;
    error: string | null;
    fetchCompetitors: () => Promise<void>;
    addCompetitor: (name: string, url: string) => Promise<void>;
}

// @ts-ignore
export const useCompetitorStore = create<any>((set: any) => ({
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
        try {
            // Optimistic update logic could go here
            const newOne = await createCompetitor({ name, url, monitoring_enabled: true, scan_frequency: 'Daily' });
            set((state) => ({ competitors: [...state.competitors, newOne] }));
        } catch (err) {
            console.error(err);
        }
    },
}));
