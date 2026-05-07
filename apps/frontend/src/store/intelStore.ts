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

export interface SourceReference {
  title: string;
  url: string;
  platform?: string;
  credibility_score?: number;
  snippet?: string;
  date?: string;
}

export interface ScanFeature {
  feature_title: string;
  technical_summary: string;
  publish_date: string;
  source_url: string;
  source_domain: string;
  category: 'API' | 'UI' | 'Infrastructure' | 'Security' | 'Platform' | 'AI' | 'SDK';
  confidence_score: number;
  evidence_sources?: SourceReference[];
  verification_status?: string;
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



export interface EvidencePoint {
  text: string;
  source_url?: string;
  source_title?: string;
  confidence?: number;
}

export interface MissionBriefingData {
  executive_summary: string;
  technical_risks: EvidencePoint[];
  market_opportunities: EvidencePoint[];
  sentiment_pulse: string;
  last_updated: string;
  evidence_catalog?: SourceReference[];
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
  global_confidence_score?: number;
  sources_catalog?: SourceReference[];
  profile?: {
    business_model: string;
    market_position: string;
    core_products: string[];
    target_audience: string;
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  };
  discovered_competitors: {
    name: string;
    url: string;
    industry: string;
    difference: string;
  }[];
}

export interface SilenceAnalysis {
  is_silent: boolean;
  last_activity_at: string;
  silence_duration: string;
  activity_frequency: number;
  momentum_score: number;
  alert_level: string;
  insight: string;
}

interface IntelState {
  report: any | null;
  scanReport: ScanReport | null;
  agentReport: string | null;
  history: any[];
  signals: any[];
  recommendations: any[];
  activities: any[];
  silenceAnalysis: SilenceAnalysis | null;
  innovationTrends: any | null;
  globalMetrics: GlobalMetrics | null;
  comparisonMatrix: MarketComparisonMetric[];
  monthlyReleases: any[];

  lastSevenDays: any[];
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

  fetchMissionBriefing: () => Promise<void>;
  fetchCompetitors: () => Promise<void>;
  fetchStrategicPlan: (competitorId: string, focusArea: string, riskLevel: string) => Promise<void>;
  runMarketScan: (payload: { company_name: string; website?: string | null; time_window_days?: number }) => Promise<void>;
  analyzeCompany: (company: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  fetchDashboardOverview: (query?: string) => Promise<void>;
  refreshAllData: (query?: string) => Promise<void>;
  clear: () => void;
  scansInProgress: Set<string>;
}

export const useIntelStore = create<IntelState>((set) => ({
  report: null,
  scanReport: null,
  agentReport: null,
  history: [],
  signals: [],
  recommendations: [],
  activities: [],
  silenceAnalysis: null,
  innovationTrends: null,
  globalMetrics: null,
  comparisonMatrix: [],
  lastSevenDays: [],
  missionBriefing: null,
  strategicPlan: null,
  competitors: [],
  loading: false,
  error: null,
  scansInProgress: new Set(),
  monthlyReleases: [],

  runScan: async (competitorId: string, forceRefresh = false) => {
    const { scanReport, scansInProgress, loading } = useIntelStore.getState();
    
    // 🛑 DEDUPLICATION GUARD: Prevent duplicate triggers
    if (scansInProgress.has(competitorId) && !forceRefresh) {
        console.log(`Scan for ${competitorId} already in flight. Blocking duplicate.`);
        return;
    }

    // Only show full-screen loader if we have no data for THIS specific competitor yet
    const isDifferentCompetitor = scanReport && String(scanReport.id || scanReport._id) !== competitorId;
    
    if (!scanReport || isDifferentCompetitor || forceRefresh) {
      set((state) => ({ ...state, loading: true, error: null, scanReport: isDifferentCompetitor ? null : scanReport }));
    }

    // Mark as in-progress
    set(state => ({ scansInProgress: new Set(state.scansInProgress).add(competitorId) }));
    
    const { addNotification } = useNotificationStore.getState();

    try {
      const data = await runCompetitorScan(competitorId, forceRefresh);
      set((state) => ({ ...state, scanReport: data, loading: false }));

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
      set((state) => ({ ...state, error: message, loading: false }));

      addNotification({
        title: 'Surveillance Error',
        message: `Failed to complete scan: ${message}`,
        type: 'error'
      });
    } finally {
      // Release from in-progress
      set(state => {
          const next = new Set(state.scansInProgress);
          next.delete(competitorId);
          return { scansInProgress: next };
      });
    }
  },

  fetchHistory: async (query?: string) => {
    const { history } = useIntelStore.getState();
    if (history.length === 0) set((state) => ({ ...state, loading: true }));
    try {
      const data = await getCompetitors(query);
      if (data && data.reports) {
        set((state) => ({ ...state, history: data.reports, loading: false }));
      } else if (Array.isArray(data)) {
        set((state) => ({ ...state, history: data, loading: false }));
      } else {
        set((state) => ({ ...state, history: [], loading: false }));
      }
    } catch(e) {
      console.error("Failed to fetch history", e);
      set((state) => ({ ...state, loading: false }));
    }
  },

  fetchSignals: async () => { 
    const { signals } = useIntelStore.getState();
    try {
      const { getIntelligenceStream } = await import('@/services/api');
      const data = await getIntelligenceStream(50);
      set((state) => ({ ...state, signals: data.signals || [], loading: false }));
    } catch(error) {
      console.error("Failed to fetch intelligence data:", error);
      set((state) => ({ ...state, loading: false }));
    }
  },

  fetchRecommendations: async () => {
    const { recommendations } = useIntelStore.getState();
    if (recommendations.length === 0) set((state) => ({ ...state, loading: true }));
    try {
      const { getRecommendations } = await import('@/services/api');
      const data = await getRecommendations();
      set((state) => ({ ...state, recommendations: data, loading: false }));
    } catch(e) {
      console.error("Failed to fetch recommendations", e);
      set((state) => ({ ...state, loading: false }));
    }
  },

  runMarketScan: async (payload, forceRefresh = false) => {
    const { scansInProgress } = useIntelStore.getState();
    const key = payload.company_name;

    if (scansInProgress.has(key) && !forceRefresh) return;

    set((state) => ({ ...state, loading: true, error: null, scanReport: null, report: null, agentReport: null }));
    set(state => ({ ...state, scansInProgress: new Set(state.scansInProgress).add(key) }));
    
    const { addNotification } = useNotificationStore.getState();

    try {
      const data = await runScanApi({
        company_name: payload.company_name,
        website: payload.website ?? undefined,
        time_window_days: payload.time_window_days ?? 7,
        force_refresh: forceRefresh
      });
      set((state) => ({ ...state, scanReport: data, loading: false }));

      addNotification({
        title: `Scout Success: ${payload.company_name}`,
        message: `Deep intelligence scan completed. Verified ${data.total_valid_updates} signals.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Market scan error:', err);
      const res = err.response?.data;
      const message = getScanErrorMessage(res);
      set((state) => ({ ...state, error: message, loading: false }));

      addNotification({
        title: 'Mission Interrupted',
        message: `Scout network failed for ${payload.company_name}: ${message}`,
        type: 'error'
      });
    } finally {
        set(state => {
            const next = new Set(state.scansInProgress);
            next.delete(key);
            return { scansInProgress: next };
        });
    }
  },

  analyzeCompany: async (company: string) => {
    set((state) => ({ ...state, loading: true, error: null, agentReport: null, scanReport: null }));
    const { addNotification } = useNotificationStore.getState();

    try {
      const reportMd = await analyzeCompanyApi(company);
      set((state) => ({ ...state, agentReport: reportMd, loading: false }));

      addNotification({
        title: `Analysis Compiled: ${company}`,
        message: `High-fidelity intelligence report synthesized via Groq Llama-3.`,
        type: 'info'
      });
    } catch (err: any) {
      console.error('Analyze error:', err);
      set((state) => ({ ...state, error: "Failed to connect to agent network.", loading: false }));

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
      const { getActivityTimeline } = await import('@/services/api');
      const data = await getActivityTimeline(query);
      set((state) => ({ 
        ...state,
        activities: data.days || [],
        silenceAnalysis: data.silence_analysis || null
      }));
    } catch(err) {
      console.error("Failed to fetch activity timeline:", err);
    }
  },

  fetchInnovationTrends: async () => {
    try {
      const { getInnovationTrends } = await import('@/services/api');
      const data = await getInnovationTrends();
      set((state) => ({ ...state, innovationTrends: data }));
    } catch(err) {
      console.error("Failed to fetch innovation trends:", err);
    }
  },

  fetchGlobalMetrics: async () => {
    try {
      const { getGlobalMetrics } = await import('@/services/api');
      const data = await getGlobalMetrics();
      set((state) => ({ ...state, globalMetrics: data }));
    } catch(err) {
      console.error("Failed to fetch global metrics:", err);
    }
  },

  fetchMarketComparison: async () => {
    try {
      const { getMarketComparison } = await import('@/services/api');
      const data = await getMarketComparison();
      set((state) => ({ ...state, comparisonMatrix: data }));
    } catch(err) {
      console.error("Failed to fetch market comparison:", err);
    }
  },

  fetchMonthlyReleases: async () => {
    try {
      const { getMonthlyReleases } = await import('@/services/api');
      const data = await getMonthlyReleases();
      set((state) => ({ ...state, monthlyReleases: data }));
    } catch(err) {
      console.error("Failed to fetch monthly releases:", err);
    }
  },

  fetchMissionBriefing: async () => {
    try {
      const { getMissionBriefing } = await import('@/services/api');
      const data = await getMissionBriefing();
      set((state) => ({ ...state, missionBriefing: data }));
    } catch(err) {
      console.error("Failed to fetch mission briefing:", err);
    }
  },

  fetchStrategicPlan: async (competitorId, focusArea, riskLevel) => {
    set((state) => ({ ...state, loading: true, error: null, strategicPlan: null }));
    try {
        const { getStrategicPlan } = await import('@/services/api');
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
        set((state) => ({ ...state, competitors: data }));
    } catch(err) {
        console.error("Failed to fetch competitors:", err);
    }
  },

  fetchDashboardOverview: async (query?: string) => {
    const { globalMetrics } = useIntelStore.getState();
    if (!globalMetrics) set((state) => ({ ...state, loading: true }));
    try {
      const { getDashboardOverview } = await import('@/services/api');
      const data = await getDashboardOverview(query);
      
      set((state) => ({
        ...state,
        globalMetrics: data.global_metrics,
        innovationTrends: data.innovation_trends,
        comparisonMatrix: data.market_comparison,
        signals: data.signals,
        history: data.history,

        missionBriefing: data.mission_briefing,
        activities: data.activities,
        silenceAnalysis: data.silence_analysis || null,
        loading: false
      }));
    } catch (err) {
      console.error("Failed to fetch dashboard overview:", err);
      set((state) => ({ ...state, loading: false }));
    }
  },

  refreshAllData: async (query?: string) => {
    // Refresh all global dashboard data points in parallel with safety guards
    const state = useIntelStore.getState();
    
    const safeExecute = async (actionName: string, actionFn?: () => Promise<void>) => {
      if (typeof actionFn === 'function') {
        try {
          await actionFn();
        } catch (e) {
          console.error(`Store Action Failed: ${actionName}`, e);
        }
      } else {
        console.warn(`Store Action Missing: ${actionName}`);
      }
    };

    await Promise.allSettled([
      safeExecute('fetchHistory', () => state.fetchHistory(query)),
      safeExecute('fetchSignals', state.fetchSignals),
      safeExecute('fetchActivityTimeline', () => state.fetchActivityTimeline(query)),
      safeExecute('fetchInnovationTrends', state.fetchInnovationTrends),
      safeExecute('fetchGlobalMetrics', state.fetchGlobalMetrics),
      safeExecute('fetchMarketComparison', state.fetchMarketComparison),
      safeExecute('fetchMonthlyReleases', state.fetchMonthlyReleases),
      safeExecute('fetchMissionBriefing', state.fetchMissionBriefing),
      safeExecute('fetchCompetitors', state.fetchCompetitors),
    ]);
  },

  clear: () => set((state) => ({ 
    ...state,
    report: null, 
    scanReport: null, 
    agentReport: null, 
    error: null, 
    history: [], 
    signals: [], 
    recommendations: [], 
    activities: [], 
    silenceAnalysis: null,
    innovationTrends: null, 
    globalMetrics: null, 
    strategicPlan: null, 
    competitors: [],
    monthlyReleases: [],
    lastSevenDays: []
  })),
}));
