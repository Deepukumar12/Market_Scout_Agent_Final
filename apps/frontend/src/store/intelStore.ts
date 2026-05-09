import { create } from 'zustand';
import { 
  runCompetitorScan, 
  runScan as runScanApi, 
  getCompetitors,
  getIntelligenceStream,
  getRecommendations,
  getActivityTimeline,
  getInnovationTrends,
  getGlobalMetrics,
  getMarketComparison,
  getLastSevenDays,
  getMissionBriefing,
  getStrategicPlan
} from '@/services/api';
import { useNotificationStore } from '@/store/notificationStore';

// ... (types and error helper remain same) ...

export const useIntelStore = create<IntelState>((set) => ({
  report: null,
  scanReport: null,
  agentReport: null,
  history: [],
  signals: [],
  recommendations: [],
  activities: [],
  innovationTrends: null,
  globalMetrics: null,
  comparisonMatrix: [],
  lastSevenDays: [],
  missionBriefing: null,
  strategicPlan: null,
  competitors: [],
  loading: false,
  error: null,

  runScan: async (competitorId: string) => {
    set({ loading: true, error: null });
    const { addNotification } = useNotificationStore.getState();

    try {
      const data = await runCompetitorScan(competitorId);
      set({ scanReport: data, loading: false });

      if (data.total_valid_updates > 0) {
        addNotification({
          title: `Intelligence Found: ${data.competitor}`,
          message: `Detected ${data.total_valid_updates} new technical signals.`,
          type: 'success',
          competitorId
        });
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      const res = err.response?.data;
      const message = getScanErrorMessage(res);
      set({ error: message, loading: false });

      addNotification({
        title: 'Surveillance Error',
        message: `Failed to complete scan: ${message}`,
        type: 'error'
      });
    }
  },

  fetchHistory: async (query?: string) => {
    try {
        const data = await getIntelligenceStream(50); // limit 50
        set({ history: data.signals || [] });
    } catch(err) {
        console.error("Failed to fetch history:", err);
    }
  },

  fetchSignals: async () => {
    try {
        const data = await getIntelligenceStream(50);
        set({ signals: data.signals || [] });
    } catch(error) {
        console.error("Failed to fetch intelligence data:", error);
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true });
    try {
        const data = await getRecommendations();
        set({ recommendations: data, loading: false });
    } catch(e) {
        console.error("Failed to fetch recommendations", e);
        set({ loading: false });
    }
  },

  runMarketScan: async (payload) => {
    set({ loading: true, error: null });
    const { addNotification } = useNotificationStore.getState();

    try {
      const data = await runScanApi({
        company_name: payload.company_name,
        website: payload.website ?? undefined,
        time_window_days: payload.time_window_days ?? 7,
      });
      set({ scanReport: data, loading: false });

      addNotification({
        title: `Scout Success: ${payload.company_name}`,
        message: `Deep intelligence scan completed. Verified ${data.total_valid_updates} signals.`,
        type: 'success'
      });

      // Broadcast real-time refresh to all listeners (Dashboard, Universe, etc.)
      window.dispatchEvent(new CustomEvent('intelligence-refresh'));
    } catch (err: any) {
      console.error('Market scan error:', err);
      const res = err.response?.data;
      const message = getScanErrorMessage(res);
      set({ error: message, loading: false });

      addNotification({
        title: 'Mission Interrupted',
        message: `Scout network failed for ${payload.company_name}: ${message}`,
        type: 'error'
      });
    }
  },

  fetchActivityTimeline: async (query?: string) => {
    try {
        const data = await getActivityTimeline();
        set({ activities: data.days || [] });
    } catch(err) {
        console.error("Failed to fetch activity timeline:", err);
    }
  },

  fetchInnovationTrends: async () => {
    try {
        const data = await getInnovationTrends();
        set({ innovationTrends: data });
    } catch(err) {
        console.error("Failed to fetch innovation trends:", err);
    }
  },

  fetchGlobalMetrics: async () => {
    try {
        const data = await getGlobalMetrics();
        set({ globalMetrics: data });
    } catch(err) {
        console.error("Failed to fetch global metrics:", err);
    }
  },

  fetchMarketComparison: async () => {
    try {
        const data = await getMarketComparison();
        set({ comparisonMatrix: data });
    } catch(err) {
        console.error("Failed to fetch market comparison:", err);
    }
  },

  fetchLastSevenDays: async (query?: string) => {
    try {
        const data = await getLastSevenDays(query);
        set({ lastSevenDays: data });
    } catch(err) {
        console.error("Failed to fetch last 7 days releases:", err);
    }
  },

  fetchMissionBriefing: async () => {
    try {
        const data = await getMissionBriefing();
        set({ missionBriefing: data });
    } catch(err) {
        console.error("Failed to fetch mission briefing:", err);
    }
  },

  fetchStrategicPlan: async (competitorId, focusArea, riskLevel) => {
    set({ loading: true, error: null, strategicPlan: null });
    try {
        const data = await getStrategicPlan({ 
            competitor_id: competitorId, 
            focus_area: focusArea, 
            risk_level: riskLevel 
        });
        set({ strategicPlan: data, loading: false });
    } catch(err) {
        console.error("Failed to fetch strategic plan:", err);
        set({ loading: false, error: 'Strategic Network Link Failure' });
    }
  },

  fetchCompetitors: async () => {
    try {
        const data = await getCompetitors();
        set({ competitors: data });
    } catch(err) {
        console.error("Failed to fetch competitors:", err);
    }
  },

  clear: () => set({ 
    error: null, 
    history: [], 
    signals: [], 
    recommendations: [], 
    activities: [], 
    innovationTrends: null, 
    globalMetrics: null, 
    strategicPlan: null, 
    competitors: [],
    lastSevenDays: []
  }),
}));
