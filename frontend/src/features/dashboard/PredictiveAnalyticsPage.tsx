import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Target, 
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCompetitorStore } from '@/store/competitorStore';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { PredictiveChart } from '@/components/dashboard/PredictiveChart';
import { EvidenceBadge, EvidenceCatalog } from '@/components/ui/EvidenceUI';

interface PerformerMetric {
  competitor_id: string;
  name: string;
  change_velocity_score: number;
  innovation_index: number;
  market_sentiment: string;
  predicted_trend: string;
  trend_probability: number;
}

interface FinancialData {
  company_name: string;
  annual_revenue_history: any[];
  quarterly_growth_velocity: number;
  profitability_index: number;
  evidence_catalog: any[];
}

interface PredictiveForecastingData {
    company_name: string;
    historical_points: any[];
    forecast_points: any[];
    events: any[];
    overall_confidence: number;
    primary_trend: string;
}

interface PredictiveData {
  top_performers: PerformerMetric[];
  stable_performers: PerformerMetric[];
  trending_predictions: PerformerMetric[];
  analysis_timestamp: string;
}

const PredictiveAnalyticsPage = () => {
  const { competitors, selectedCompetitorId, setSelectedCompetitorId, fetchCompetitors } = useCompetitorStore();
  const { token } = useAuthStore();
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [forecastData, setForecastData] = useState<PredictiveForecastingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    if (!selectedCompetitorId && competitors.length > 0) {
      setSelectedCompetitorId(competitors[0].id || competitors[0]._id || null);
    }
  }, [competitors, selectedCompetitorId, setSelectedCompetitorId]);

  const fetchDataFixed = async () => {
    setLoading(true);
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
      
      const predRes = await fetch(`${apiUrl}/api/v1/intelligence/predictive-pipeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (predRes.ok) setPredictiveData(await predRes.json());

      if (selectedCompetitorId) {
        // Fetch Financial Intelligence
        const finRes = await fetch(`${apiUrl}/api/v1/intelligence/financial-intelligence?competitor_id=${selectedCompetitorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (finRes.ok) setFinancialData(await finRes.json());

        // Fetch Predictive Forecasting
        const foreRes = await fetch(`${apiUrl}/api/v1/intelligence/predictive-forecasting?competitor_id=${selectedCompetitorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (foreRes.ok) setForecastData(await foreRes.json());
      }
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDataFixed();
  }, [selectedCompetitorId, token]);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <TrendingUp size={14} className="text-[#34C759]" />
             <span className="text-[10px] font-black text-[#34C759] uppercase tracking-[0.2em] italic">Predictive Intelligence Engine</span>
          </div>
          <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Growth <span className="text-primary">Forecasting</span></h1>
          <p className="text-muted-foreground font-medium italic">High-fidelity predictive analytics and market expansion modeling.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <select 
              value={selectedCompetitorId || ''} 
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="h-12 px-6 rounded-2xl border border-border bg-card text-sm font-bold text-foreground focus:outline-none shadow-apple-sm min-w-[200px]"
            >
              <option value="" disabled>Focus Target</option>
              {competitors.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
            {financialData && <EvidenceBadge count={financialData.evidence_catalog.length} confidence={92} status="Audited" />}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Main Predictive Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 p-10 rounded-[40px] bg-card/70 backdrop-blur-xl border border-border shadow-apple h-[600px]">
                  {forecastData ? (
                      <PredictiveChart 
                        historicalData={forecastData.historical_points} 
                        forecastData={forecastData.forecast_points} 
                        events={forecastData.events}
                        companyName={forecastData.company_name}
                        confidence={forecastData.overall_confidence}
                      />
                  ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic font-medium">
                          Select a target to generate predictive vector.
                      </div>
                  )}
              </div>

              <div className="lg:col-span-1 space-y-8">
                  <div className="p-8 rounded-[40px] bg-foreground text-background shadow-apple flex flex-col justify-between h-[280px] relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Zap size={120} className="text-primary" />
                      </div>
                      <div>
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic mb-4">Strategic Trend</h3>
                          <div className="text-4xl font-black text-white tracking-tighter italic mb-2">{forecastData?.primary_trend || "N/A"}</div>
                          <p className="text-xs text-white/50 font-bold uppercase tracking-widest italic leading-relaxed">
                            Detected momentum shift based on hiring acceleration and technical signal density.
                          </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest italic pt-4 border-t border-white/10">
                          <BarChart3 size={12} /> AI Forecast Accuracy: {forecastData?.overall_confidence || 0}%
                      </div>
                  </div>

                  <div className="p-8 rounded-[40px] bg-card border border-border shadow-apple flex flex-col justify-between h-[280px] relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Target size={120} className="text-primary" />
                      </div>
                      <div>
                          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic mb-4">Growth Velocity</h3>
                          <div className="text-4xl font-black text-foreground tracking-tighter italic">+{financialData?.quarterly_growth_velocity || 0}%</div>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic mt-2">Historical Baseline</p>
                      </div>
                      <Button 
                        onClick={() => setShowEvidence(!showEvidence)}
                        variant="ghost" 
                        className="w-full h-14 rounded-2xl border border-border bg-muted/50 font-black uppercase tracking-widest text-[9px] italic"
                      >
                          {showEvidence ? 'Hide Model Evidence' : 'Analyze Forecasting Provenance'}
                      </Button>
                  </div>
              </div>
          </div>

          {/* Evidence Catalog Overlay */}
          <AnimatePresence>
                {showEvidence && financialData && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-10 rounded-[40px] bg-[#1c1c1e] text-white shadow-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Info className="text-primary" size={24} />
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Forecasting <span className="text-primary">Signals</span></h2>
                                </div>
                                <Button variant="ghost" onClick={() => setShowEvidence(false)} className="text-white/50 hover:text-white hover:bg-white/10">Close</Button>
                            </div>
                            <EvidenceCatalog sources={financialData.evidence_catalog} />
                        </div>
                    </motion.div>
                )}
          </AnimatePresence>

          {/* Predictive Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {predictiveData?.trending_predictions.map((p, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[40px] bg-card border border-border shadow-apple flex flex-col gap-6 group"
                  >
                      <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary font-black text-xl italic border border-border">
                              {p.name.charAt(0)}
                          </div>
                          <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic mb-1">Confidence</span>
                              <div className="flex items-center gap-1">
                                  <span className="text-sm font-black text-foreground italic">{p.trend_probability * 100}%</span>
                                  <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary" style={{ width: `${p.trend_probability * 100}%` }} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-1">
                          <h4 className="text-xl font-black text-foreground uppercase italic tracking-tighter leading-none">{p.name}</h4>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">{p.predicted_trend}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-6 border-y border-border">
                          <div>
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic mb-1">Innovation Index</div>
                              <div className="text-lg font-black text-foreground italic">{p.innovation_index}</div>
                          </div>
                          <div>
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic mb-1">Market Sentiment</div>
                              <div className="text-lg font-black text-foreground italic">{p.market_sentiment}</div>
                          </div>
                      </div>

                      <Button className="w-full h-12 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-[9px] italic group-hover:bg-primary group-hover:text-white transition-colors">
                          Analyze Vector <ArrowUpRight size={14} className="ml-2" />
                      </Button>
                  </motion.div>
              ))}
          </div>

          <div className="p-12 rounded-[50px] bg-gradient-to-br from-primary to-[#0077ED] text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
              <div className="absolute -left-20 -bottom-20 p-20 opacity-10">
                  <PieChartIcon size={300} />
              </div>
              <div className="space-y-4 max-w-2xl relative z-10">
                  <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Q3 2026 Projections</span>
                  </div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Enterprise <span className="text-white/60">Expansion Roadmap</span></h2>
                  <p className="text-lg font-medium italic text-white/80 leading-relaxed">
                      Our predictive engines have detected a {predictiveData?.top_performers[0]?.trend_probability * 100}% probability shift in the {predictiveData?.top_performers[0]?.name} market vector. Initiate defensive roadmap protocols immediately.
                  </p>
              </div>
              <div className="flex flex-col gap-4 w-full lg:w-auto relative z-10">
                  <Button className="h-16 px-10 rounded-2xl bg-white text-primary font-black uppercase tracking-widest text-xs italic shadow-xl hover:scale-105 transition-transform">
                      Unlock Full Roadmap
                  </Button>
                  <Button variant="ghost" className="h-16 px-10 rounded-2xl border border-white/20 text-white font-black uppercase tracking-widest text-xs italic hover:bg-white/10">
                      View Secondary Triggers
                  </Button>
              </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PredictiveAnalyticsPage;
