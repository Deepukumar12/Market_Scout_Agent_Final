import { useEffect } from "react";
import { Zap, Github, Twitter, Linkedin, Mail, ArrowRight, Activity, Globe, Cpu, Shield, Lock, Server, Terminal, BarChart3, Database, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useIntelStore } from "@/store/intelStore";
import { cn } from "@/utils/utils";

export function Footer() {
  const { globalMetrics, fetchGlobalMetrics } = useIntelStore();

  useEffect(() => {
    fetchGlobalMetrics();
    const interval = setInterval(fetchGlobalMetrics, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, [fetchGlobalMetrics]);

  const footerSections = [
    {
      title: "Intelligence Platform",
      links: [
        { label: "Market Intelligence", href: "#intelligence" },
        { label: "Competitor Surveillance", href: "#intelligence" },
        { label: "Predictive Analytics", href: "#intelligence" },
        { label: "Sentiment Decoding", href: "#intelligence" },
        { label: "Technical Signals", href: "#intelligence" },
        { label: "RAG Architecture", href: "#infrastructure" },
      ]
    },
    {
      title: "Enterprise Solutions",
      links: [
        { label: "Global Infrastructure", href: "#infrastructure" },
        { label: "Edge Intelligence", href: "#infrastructure" },
        { label: "Security & Compliance", href: "#security" },
        { label: "API Documentation", href: "#" },
        { label: "System Integration", href: "#" },
        { label: "Custom Model Training", href: "#" },
      ]
    },
    {
      title: "Trust & Transparency",
      links: [
        { label: "Security Whitepaper", href: "#security" },
        { label: "Privacy Protocol", href: "#security" },
        { label: "Data Integrity", href: "#security" },
        { label: "Ethics Framework", href: "#" },
        { label: "Compliance Center", href: "#" },
        { label: "Uptime Status", href: "#" },
      ]
    },
    {
      title: "Corporate",
      links: [
        { label: "About ScoutIQ", href: "#" },
        { label: "Leadership", href: "#" },
        { label: "Press & Media", href: "#" },
        { label: "Career Portal", href: "#" },
        { label: "Investor Relations", href: "#enterprise" },
        { label: "Contact Command", href: "mailto:deeputhakur0986@gmail.com" },
      ]
    }
  ];

  return (
    <footer className="relative border-t border-[#F0F0F3] dark:border-white/5 bg-white dark:bg-[#050505] transition-colors duration-700 overflow-hidden">
      {/* Premium Gradient Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-600/50 to-transparent" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 dark:bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-indigo-600/5 dark:bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 pt-32 pb-16 relative z-10">
        
        {/* Top Intelligence Bar */}
        <div className="grid lg:grid-cols-4 gap-12 mb-32 border-b border-[#F0F0F3] dark:border-white/5 pb-24">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 group-hover:scale-110 transition-all duration-500">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter text-[#1D1D1F] dark:text-white uppercase italic">
                  SCOUT<span className="text-blue-600">IQ</span>
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Operational Intelligence</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-5xl md:text-6xl font-black tracking-tight text-[#1D1D1F] dark:text-white leading-[0.9] italic max-w-xl">
              Mapping the future of <span className="text-blue-600">Market Surveillance.</span>
            </h3>
            
            <p className="text-lg text-[#6E6E73] dark:text-[#86868B] font-medium max-w-lg leading-relaxed">
              ScoutIQ delivers sub-second competitive intelligence through a global mesh of autonomous agents. Deciphering signals, ensuring market dominance.
            </p>

            <div className="flex items-center gap-6 pt-4">
              <SocialIcon href="https://github.com/Deepukumar12" icon={<Github size={20} />} label="GitHub" />
              <SocialIcon href="https://x.com/Deepukumar24" icon={<Twitter size={20} />} label="Twitter" />
              <SocialIcon href="https://www.linkedin.com/in/deepu-kumar-393564289/" icon={<Linkedin size={20} />} label="LinkedIn" />
              <SocialIcon href="mailto:deeputhakur0986@gmail.com" icon={<Mail size={20} />} label="Email" />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <div className="p-10 rounded-[3rem] bg-blue-600 dark:bg-blue-600/10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <MessageSquare size={120} strokeWidth={1} />
              </div>
              <div className="relative z-10 space-y-6">
                <h4 className="text-3xl font-black italic uppercase tracking-tighter">Stay Ahead of the Signal</h4>
                <p className="text-blue-100 dark:text-blue-300 text-sm font-medium max-w-sm">Join 5,000+ enterprise leaders receiving our weekly market intelligence briefing.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="Enter corporate email" 
                    className="flex-1 h-14 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 px-6 text-sm font-bold placeholder:text-blue-200 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <Button className="h-14 px-8 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black uppercase tracking-widest text-xs shadow-xl">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <MetricCard 
                icon={<Globe className="text-blue-600" size={24} />}
                label="Global Nodes"
                value={globalMetrics?.total_competitors || "0"}
                subValue="+12% Active"
              />
              <MetricCard 
                icon={<Activity className="text-blue-600" size={24} />}
                label="Signal Synthesis"
                value={globalMetrics?.articles_processed || "0"}
                subValue="Real-time Flow"
              />
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-32">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-8">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#1D1D1F] dark:text-white border-b border-[#F0F0F3] dark:border-white/5 pb-4">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-sm font-bold text-[#6E6E73] dark:text-[#86868B] hover:text-blue-600 dark:hover:text-white transition-all duration-300 flex items-center group gap-2"
                    >
                      <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Panel */}
        <div className="pt-16 border-t border-[#F0F0F3] dark:border-white/5 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex flex-col md:flex-row items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#86868B]">
            <div className="flex items-center gap-6">
              <span>© 2026 ScoutIQ Intelligence Protocol.</span>
              <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10" />
              <div className="flex items-center gap-3">
                <span className="text-[#1D1D1F] dark:text-white">Built by Deepu Kumar</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-blue-600 italic">Advanced Agentic Coding v2.4</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex flex-wrap justify-center gap-10 text-[11px] font-black uppercase tracking-[0.3em] text-[#86868B]">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">SLA</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Status</a>
            </div>
            <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-full border border-[#F0F0F3] dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-[#86868B] hover:border-blue-600/30 transition-colors cursor-pointer">
              <Globe size={14} />
              <span>United States (English)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Badge */}
      <div className="absolute -bottom-10 right-10 text-[120px] font-black text-black/[0.02] dark:text-white/[0.02] select-none pointer-events-none uppercase italic tracking-tighter">
        SURVEILLANCE
      </div>
    </footer>
  );
}

function SocialIcon({ icon, href, label }: { icon: React.ReactNode, href: string, label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label={label}
      className="w-12 h-12 rounded-xl bg-[#FBFBFE] dark:bg-white/5 border border-[#F0F0F3] dark:border-white/5 flex items-center justify-center text-[#86868B] hover:text-blue-600 hover:border-blue-600/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1"
    >
      {icon}
    </a>
  );
}

function MetricCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-[#FBFBFE] dark:bg-white/5 border border-[#F0F0F3] dark:border-white/5 shadow-2xl shadow-black/5 hover:border-blue-600/20 transition-all duration-500 group">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868B]">{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-black text-[#1D1D1F] dark:text-white tracking-tighter">{value}</span>
        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{subValue}</span>
      </div>
    </div>
  );
}


