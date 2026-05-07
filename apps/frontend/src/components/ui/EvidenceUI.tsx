
import React from 'react';
import { ShieldCheck, ExternalLink, Link2, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Source {
  title: string;
  url: string;
  platform?: string;
  credibility_score?: number;
  snippet?: string;
  date?: string;
}

interface EvidenceBadgeProps {
  count: number;
  confidence: number;
  status?: string;
  onClick?: () => void;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ count, confidence, status = "Verified", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2 py-1 rounded-full cursor-pointer transition-all group"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
        {status} ({count})
      </span>
      <div className="h-3 w-px bg-primary/20 mx-0.5" />
      <span className="text-[10px] font-black text-foreground/70">
        {confidence}%
      </span>
    </div>
  );
};

interface EvidencePanelProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ sources, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute z-50 mt-2 w-72 bg-card border border-border rounded-2xl shadow-apple-large overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Link2 className="w-3 h-3 text-primary" />
              Verified Intelligence Sources
            </h4>
            <span className="text-[10px] font-bold text-muted-foreground">{sources.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {sources.length > 0 ? (
              sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col p-2 hover:bg-muted rounded-xl transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {source.title || "Source Reference"}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded">
                      {source.platform || "Web"}
                    </span>
                    {source.date && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {source.date}
                      </div>
                    )}
                  </div>
                </a>
              ))
            ) : (
              <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                No external links archived for this signal.
              </div>
            )}
          </div>
          <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-center">
            <button 
              onClick={onClose}
              className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss Evidence
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const EvidenceCatalog: React.FC<{ sources: Source[] }> = ({ sources }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source, i) => (
                <a 
                    key={i} 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                            {source.platform || 'Source'}
                        </span>
                        <ExternalLink size={14} className="text-white/30 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tight mb-2 line-clamp-1">{source.title || 'Reference Node'}</h4>
                    {source.snippet && (
                        <p className="text-[10px] text-white/50 font-medium italic leading-relaxed line-clamp-3">
                            "{source.snippet}"
                        </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{source.date || 'Live Data'}</span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">92% Credibility</span>
                    </div>
                </a>
            ))}
        </div>
    );
}
