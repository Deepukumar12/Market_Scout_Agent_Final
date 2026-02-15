
import { create } from 'zustand';
import { getCompetitors } from '../services/api';

interface SearchResult {
    id: string;
    name: string;
    type: 'competitor' | 'report';
    url?: string;
}

interface SearchState {
    query: string;
    results: SearchResult[];
    isLoading: boolean;
    isOpen: boolean;
    setQuery: (query: string) => void;
    setIsOpen: (isOpen: boolean) => void;
    performSearch: (query: string) => Promise<void>;
    clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
    query: '',
    results: [],
    isLoading: false,
    isOpen: false,
    setQuery: (query) => {
        set({ query });
        if (query.length >= 2) {
            get().performSearch(query);
        } else {
            set({ results: [] });
        }
    },
    setIsOpen: (isOpen) => set({ isOpen }),
    performSearch: async (query) => {
        set({ isLoading: true });
        try {
            // For now, we only search competitors
            const competitors = await getCompetitors(query);
            const formattedResults: SearchResult[] = competitors.map((c: any) => ({
                id: c._id || c.id,
                name: c.name,
                type: 'competitor',
                url: `/dashboard/competitors/${c._id || c.id}/report`
            }));
            set({ results: formattedResults, isLoading: false, isOpen: true });
        } catch (error) {
            console.error('Search failed:', error);
            set({ isLoading: false });
        }
    },
    clearResults: () => set({ results: [], query: '', isOpen: false }),
}));
