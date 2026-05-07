import { create } from 'zustand';
import { runCompetitorScan, runScan as runScanApi, analyzeCompany as analyzeCompanyApi, deleteReport as deleteReportApi, getCompetitors } from '@/services/api';
import { useNotificationStore } from '@/store/notificationStore';

function getScanErrorMessage(res: any): string {
  if (!res) return 'Scan failed. Check that the backend is running and API keys are set.';
  const err = res.error ?? (typeof res.detail === 'string' ? res.detail : null);
  const detail = typeof res.detail === 'string' ? res.detail : null;
  if (err && detail && err !== detail) return `${err}: ${detail}`;
  return err || 'Scan failed.';
}

export interface ScanFeature {
  feature_title: string;
  technical_summary: string;
  publish_date: string;
  source_url: string;
  source_domain: string;
  category: 'API' | 'UI' | 'Infrastructure' | 'Security' | 'Platform' | 'AI' | 'SDK';
  confidence_score: number;
}

export interface GlobalMetrics {
  total_competitors: number;
  total_reports: number;
  features_found: number;
  articles_processed: number;
  system_latency: number;
  last_update: string;
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

export interface MonthlyRelease {
  company_name: string;
  feature_name: string;
  category: string;
  release_date: string;
  source_url?: string;
  hash_id: string;
}

export interface MissionBriefingData {
  executive_summary: string;
  technical_risks: string[];
  market_opportunities: string[];
  sentiment_pulse: string;
  last_updated: string;
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
  features: ScanFeature[];
}

interface IntelState {
  report: any | null;
  scanReport: ScanReport | null;
  agentReport: string | null;
  history: any[];
  signals: any[];
  recommendations: any[];
  activities: any[];
  innovationTrends: any | null;
  globalMetrics: GlobalMetrics | null;
  comparisonMatrix: MarketComparisonMetric[];
  monthlyReleases: MonthlyRelease[];
  lastSevenDays: MonthlyRelease[];
  missionBriefing: MissionBriefingData | null;
  strategicPlan: StrategicPlan | null;
  competitors: any[];
  loading: boolean;
  error: string | null;
  runScan: (competitorId: string) => Promise<void>;
  fetchHistory: (query?: string) => Promise<void>;
  fetchSignals: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchActivityTimeline: (query?: string) => Promise<void>;
  fetchInnovationTrends: () => Promise<void>;
  fetchGlobalMetrics: () => Promise<void>;
  fetchMarketComparison: () => Promise<void>;
  fetchMonthlyReleases: () => Promise<void>;
  fetchLastSevenDays: (query?: string) => Promise<void>;
  fetchMissionBriefing: () => Promise<void>;
  fetchCompetitors: () => Promise<void>;
  fetchStrategicPlan: (competitorId: string, focusArea: string, riskLevel: string) => Promise<void>;
  runMarketScan: (payload: { company_name: string; website?: string | null; time_window_days?: number }) => Promise<void>;
  analyzeCompany: (company: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  clear: () => void;
}

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
  monthlyReleases: [],
  lastSevenDays: [],
  missionBriefing: null,
  strategicPlan: null,
  competitors: [],
  loading: false,
  error: null,

  runScan: async (competitorId: string) => {
    set({ loading: true, error: null, scanReport: null, report: null });
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
    set({ loading: true });
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        let url = `${apiUrl}/api/v1/reports/history?limit=12`;
        if (query) url += `&competitor=${encodeURIComponent(query)}`;
        
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ history: data.reports || [], loading: false });
        } else {
            set({ loading: false });
        }
    } catch(e) {
        console.error("Failed to fetch history", e);
        set({ loading: false });
    }
  },

  fetchSignals: async () => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/stream?limit=50`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ signals: data.signals || [] });
        }
    } catch(error) {
        console.error("Failed to fetch intelligence data:", error);
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true });
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/recommendations`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ recommendations: data, loading: false });
        } else {
            set({ loading: false });
        }
    } catch(e) {
        console.error("Failed to fetch recommendations", e);
        set({ loading: false });
    }
  },

  runMarketScan: async (payload) => {
    set({ loading: true, error: null, scanReport: null, report: null, agentReport: null });
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

  analyzeCompany: async (company: string) => {
    set({ loading: true, error: null, agentReport: null, scanReport: null });
    const { addNotification } = useNotificationStore.getState();

    try {
      const reportMd = await analyzeCompanyApi(company);
      set({ agentReport: reportMd, loading: false });

      addNotification({
        title: `Analysis Compiled: ${company}`,
        message: `High-fidelity intelligence report synthesized via Groq Llama-3.`,
        type: 'info'
      });
    } catch (err: any) {
      console.error('Analyze error:', err);
      set({ error: "Failed to connect to agent network.", loading: false });

      addNotification({
        title: 'Synthesis Failed',
        message: `Could not compile intelligence for ${company}.`,
        type: 'error'
      });
    }
  },

  deleteReport: async (reportId: string) => {
    const { addNotification } = useNotificationStore.getState();
    try {
      await deleteReportApi(reportId);
      addNotification({
        title: 'Report Purged',
        message: 'Intelligence brief successfully removed from archives.',
        type: 'info'
      });
    } catch (err: any) {
      console.error('Delete report error:', err);
      addNotification({
        title: 'Cleanup Failed',
        message: 'Could not remove report from the system.',
        type: 'error'
      });
    }
  },

  fetchActivityTimeline: async (query?: string) => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        let url = `${apiUrl}/api/v1/intelligence/activity-timeline`;
        if (query) url += `?competitor=${encodeURIComponent(query)}`;
        
        const res = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
        });
        if(res.ok) {
            const data = await res.json();
            set({ activities: data.days || [] });
        }
    } catch(err) {
        console.error("Failed to fetch activity timeline:", err);
    }
  },

  fetchInnovationTrends: async () => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/innovation-trends`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ innovationTrends: data });
        }
    } catch(err) {
        console.error("Failed to fetch innovation trends:", err);
    }
  },

  fetchGlobalMetrics: async () => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/global-metrics`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ globalMetrics: data });
        }
    } catch(err) {
        console.error("Failed to fetch global metrics:", err);
    }
  },

  fetchMarketComparison: async () => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/market-comparison`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ comparisonMatrix: data });
        }
    } catch(err) {
        console.error("Failed to fetch market comparison:", err);
    }
  },

  fetchMonthlyReleases: async () => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/monthly-releases`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ monthlyReleases: data });
        }
    } catch(err) {
        console.error("Failed to fetch monthly releases:", err);
    }
  },

  fetchLastSevenDays: async (query?: string) => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        let url = `${apiUrl}/api/v1/intelligence/last-seven-days`;
        if (query) url += `?competitor=${encodeURIComponent(query)}`;

        const res = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
        });
        if(res.ok) {
            const data = await res.json();
            set({ lastSevenDays: data });
        }
    } catch(err) {
        console.error("Failed to fetch last 7 days releases:", err);
    }
  },
  fetchMissionBriefing: async () => {
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/mission-briefing`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            set({ missionBriefing: data });
        }
    } catch(err) {
        console.error("Failed to fetch mission briefing:", err);
    }
  },

  fetchStrategicPlan: async (competitorId, focusArea, riskLevel) => {
    set({ loading: true, error: null, strategicPlan: null });
    try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/strategic-plan`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('scoutiq_token')}` 
            },
            body: JSON.stringify({ competitor_id: competitorId, focus_area: focusArea, risk_level: riskLevel })
        });
        if(res.ok) {
            const data = await res.json();
            set({ strategicPlan: data, loading: false });
        } else {
            set({ loading: false, error: 'Strategic Engine Busy' });
        }
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
    report: null, 
    scanReport: null, 
    agentReport: null, 
    error: null, 
    history: [], 
    signals: [], 
    recommendations: [], 
    activities: [], 
    innovationTrends: null, 
    globalMetrics: null, 
    strategicPlan: null, 
    competitors: [],
    monthlyReleases: [],
    lastSevenDays: []
  }),
}));
