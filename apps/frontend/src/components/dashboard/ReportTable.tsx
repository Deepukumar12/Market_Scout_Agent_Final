import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Report {
  id: string;
  company: string;
  featuresFound: number;
  sources: number;
  time: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

interface ReportTableProps {
  reports: Report[];
  onRowClick: (id: string) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ reports, onRowClick }) => {
  return (
    <div className="bg-card/70 backdrop-blur-xl rounded-[40px] border border-border shadow-apple overflow-hidden">
      <div className="p-8 border-b border-border">
        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">SURVEILLANCE <span className="text-primary">LOGS</span></h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ENTITY IDENTIFIER</th>
              <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">VECTOR COUNT</th>
              <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">TELEMETRY SOURCES</th>
              <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">LAST SIGNAL</th>
              <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">STATUS</th>
              <th className="px-8 py-4 text-[10px] font-black text-muted-foreground  uppercase tracking-[0.2em]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {reports.map((report) => (
              <motion.tr 
                key={report.id}
                whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
                onClick={() => onRowClick(report.id)}
                className="cursor-pointer transition-colors border-b border-border/50 last:border-0"
              >
                <td className="px-8 py-5">
                  <span className="font-black text-foreground uppercase italic tracking-tighter">{report.company}</span>
                </td>
                <td className="px-8 py-5 text-muted-foreground font-medium italic">{report.featuresFound} VECTORS</td>
                <td className="px-8 py-5 text-muted-foreground font-medium italic">{report.sources} SIGNALS</td>
                <td className="px-8 py-5 text-muted-foreground font-medium italic text-xs">{report.time}</td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    report.status === 'Completed' ? "border-green-500/20 text-green-500 bg-green-500/5" : 
                    report.status === 'Processing' ? "border-primary/20 text-primary bg-primary/5" : "border-red-500/20 text-red-500 bg-red-500/5"
                  )}>
                    {report.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <ChevronRight size={18} className="text-muted-foreground/30 inline group-hover:text-primary transition-colors" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
