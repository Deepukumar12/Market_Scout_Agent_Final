
import { create } from 'zustand';
import { runCompetitorScan, runScan as runScanApi, analyzeCompany as analyzeCompanyApi } from '@/services/api';
import { useNotificationStore } from '@/store/notificationStore';

function getScanErrorMessage(res: any): string {
  if (!res) return 'Scan failed. Check that the backend is running and API keys are set.';
  const err = res.error ?? (typeof res.detail === 'string' ? res.detail : null);
  const detail = typeof res.detail === 'string' ? res.detail : null;
  if (err && detail && err !== detail) return `${err}: ${detail}`;
  return err || 'Scan failed.';
}

/** Legacy competitor-based scan (POST /competitors/:id/scan) */
interface CIReportFeature {
  title: string;
  technical_summary: string;
  publish_date: string;
  source_urls: string[];
  category: 'API' | 'UI' | 'Infrastructure' | 'Security' | 'AI' | 'SDK' | 'Platform';
  confidence_score: number;
  confidence_reasoning: string;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_reasoning: string;
  suggested_action: string;
}

export interface CIReport {
  _id?: string;
  competitor: string;
  scan_date: string;
  features: CIReportFeature[];
  executive_summary: string;
  innovation_velocity_score: number;
  velocity_reasoning: string;
  competitor_id?: string;
}

/** Market Scout Agent scan response – real data only, no synthetic fallback */
export interface ScanFeature {
  feature_title: string;
  technical_summary: string;
  publish_date: string;
  source_url: string;
  source_domain: string;
  category: 'API' | 'UI' | 'Infrastructure' | 'Security' | 'Platform' | 'AI' | 'SDK';
  confidence_score: number;
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
  /** Legacy report (competitor-based scan) */
  report: CIReport | null;
  /** Legacy/Structured scan result */
  scanReport: ScanReport | null;
  /** New Market Scout Agent scan response – Markdown string */
  agentReport: string | null;
  loading: boolean;
  error: string | null;
  runScan: (competitorId: string) => Promise<void>;
  /** Run Market Scout Agent scan with company name + optional website */
  runMarketScan: (payload: { company_name: string; website?: string | null; time_window_days?: number }) => Promise<void>;
  analyzeCompany: (company: string) => Promise<void>;
  clear: () => void;
}

export const useIntelStore = create<IntelState>((set) => ({
  report: null,
  scanReport: null,
  agentReport: null,
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
          message: `Detected ${data.total_valid_updates} new technical signals from the last 7 days.`,
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

  clear: () => set({ report: null, scanReport: null, agentReport: null, error: null }),
}));
