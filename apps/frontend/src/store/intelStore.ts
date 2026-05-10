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
  getStrategicPlan,
  getLatestReport,
  getSystemStats
} from '@/services/api';
import { useNotificationStore } from '@/store/notificationStore';

// --- TYPES ---

export interface IntelSignal {
  id: string;
  company_name: string;
  sector: string;
  signal_type: string;
  confidence_score: number;
  timestamp: string;
  summary: string;
  source: string;
  url: string;
  sentiment: string;
  impact_score: number;
}

export interface GlobalMetrics {
  total_competitors: number;
  competitors_trend: number;
  features_found: number;
  features_trend: number;
  articles_processed: number;
  articles_trend: number;
  system_latency: number;
  last_update: string;
}

export interface MissionBriefingData {
  executive_summary: string;
  technical_risks: string[];
  market_opportunities: string[];
  sentiment_pulse: string;
  last_updated: string;
}

export interface SevenDaySignal {
  company_name: string;
  feature_name: string;
  category: string;
  release_date: string;
  source_url?: string;
  hash_id: string;
  summary?: string;
  source_type: string;
}

export interface InnovationTrends {
  timeline: {
    date: string;
    releases: Record<string, number>;
  }[];
  top_innovators: {
    name: string;
    score: number;
    top_feature: string;
  }[];
  sector_shift: {
    sector: string;
    velocity: string;
    delta: number;
  }[];
}

export interface MarketComparisonMetric {
  competitor: string;
  sector: string;
  features_count: number;
  innovation_score: number;
  risk_level: string;
  sentiment: string;
  velocity: string;
}

export interface StrategicPlan {
  id: string;
  title: string;
  summary: string;
  impact: string;
  confidence: number;
  timeToMarket: string;
  estimatedROI: string;
  marketTrigger: string;
  marketGap: string;
  targetAudience: string;
  coreCapabilities: string[];
  implementation: { step: string; detail: string }[];
  risks: string[];
  tags: string[];
  financialProjections: { month: string; value: number; cost: number }[];
}

export interface ScanReport {
  competitor: string;
  scan_date: string;
  time_window_days: number;
  total_sources_scanned: number;
  total_valid_updates: number;
  features: any[];
  company?: any;
  financials?: any;
  news: any[];
  search_visibility?: any;
  social: any[];
}

export interface SystemStats {
  status: string;
  nodes: number;
  cpu: number;
  memory: number;
  uptime: string;
  region: string;
  last_heartbeat: string;
}

interface IntelState {
  report: any | null;
  scanReport: ScanReport | null;
  agentReport: any | null;
  history: IntelSignal[];
  signals: IntelSignal[];
  recommendations: any[];
  activities: any[];
  innovationTrends: InnovationTrends | null;
  globalMetrics: GlobalMetrics | null;
  systemStats: SystemStats | null;
  comparisonMatrix: MarketComparisonMetric[];
  lastSevenDays: SevenDaySignal[];
  missionBriefing: MissionBriefingData | null;
  strategicPlan: StrategicPlan | null;
  competitors: any[];
  loading: boolean;
  error: string | null;

  fetchLatestReport: () => Promise<void>;
  runScan: (competitorId: string) => Promise<void>;
  fetchHistory: (query?: string) => Promise<void>;
  fetchSignals: (query?: string) => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  runMarketScan: (payload: any) => Promise<void>;
  fetchActivityTimeline: (query?: string) => Promise<void>;
  fetchInnovationTrends: () => Promise<void>;
  fetchGlobalMetrics: () => Promise<void>;
  fetchSystemStats: () => Promise<void>;
  fetchMarketComparison: () => Promise<void>;
  fetchLastSevenDays: (query?: string) => Promise<void>;
  fetchMissionBriefing: () => Promise<void>;
  fetchStrategicPlan: (competitorId: string, focusArea: string, riskLevel: string) => Promise<void>;
  fetchCompetitors: (query?: string) => Promise<void>;
  clear: () => void;
}

const getScanErrorMessage = (res: any) => {
  if (!res) return 'Network surveillance timeout.';
  if (res.detail === 'Ollama unreachable') return 'Local AI node offline.';
  if (res.detail === 'Gemini quota exceeded') return 'Global intelligence quota reached.';
  return res.detail || 'Strategic link failure.';
};

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

  fetchLatestReport: async () => {
    try {
      const data = await getLatestReport();
      if (data) set({ scanReport: data });
    } catch (err) {
      console.error("Failed to fetch latest report:", err);
    }
  },

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
      const data = await getIntelligenceStream(50, query);
      set({ history: data.signals || [] });
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  },

  fetchSignals: async (query?: string) => {
    try {
      const data = await getIntelligenceStream(50, query);
      set({ signals: data.signals || [] });
    } catch (error) {
      console.error("Failed to fetch intelligence data:", error);
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true });
    try {
      const data = await getRecommendations();
      set({ recommendations: data, loading: false });
    } catch (e) {
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
      const data = await getActivityTimeline(query);
      set({ activities: data.days || [] });
    } catch (err) {
      console.error("Failed to fetch activity timeline:", err);
    }
  },

  fetchInnovationTrends: async () => {
    try {
      const data = await getInnovationTrends();
      set({ innovationTrends: data });
    } catch (err) {
      console.error("Failed to fetch innovation trends:", err);
    }
  },

  fetchGlobalMetrics: async () => {
    try {
      const data = await getGlobalMetrics();
      set({ globalMetrics: data });
    } catch (err) {
      console.error("Failed to fetch global metrics:", err);
    }
  },

  fetchSystemStats: async () => {
    try {
      const data = await getSystemStats();
      set({ systemStats: data });
    } catch (err) {
      console.error("Failed to fetch system stats:", err);
    }
  },

  fetchMarketComparison: async () => {
    try {
      const data = await getMarketComparison();
      set({ comparisonMatrix: data });
    } catch (err) {
      console.error("Failed to fetch market comparison:", err);
    }
  },

  fetchLastSevenDays: async (query?: string) => {
    try {
      const data = await getLastSevenDays(query);
      set({ lastSevenDays: data });
    } catch (err) {
      console.error("Failed to fetch last 7 days releases:", err);
    }
  },

  fetchMissionBriefing: async () => {
    try {
      const data = await getMissionBriefing();
      set({ missionBriefing: data });
    } catch (err) {
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
    } catch (err) {
      console.error("Failed to fetch strategic plan:", err);
      set({ loading: false, error: 'Strategic Network Link Failure' });
    }
  },

  fetchCompetitors: async (query?: string) => {
    try {
      const data = await getCompetitors(query);
      set({ competitors: data });
    } catch (err) {
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
