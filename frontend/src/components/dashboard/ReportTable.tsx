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
    <div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-[#E5E5EA] shadow-apple overflow-hidden">
      <div className="p-8 border-b border-[#E5E5EA]">
        <h3 className="text-xl font-black text-[#1D1D1F] uppercase italic tracking-tighter">SURVEILLANCE <span className="text-[#0071E3]">LOGS</span></h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F5F5F7]/50">
              <th className="px-8 py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">ENTITY IDENTIFIER</th>
              <th className="px-8 py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">VECTOR COUNT</th>
              <th className="px-8 py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">TELEMETRY SOURCES</th>
              <th className="px-8 py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">LAST SIGNAL</th>
              <th className="px-8 py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">STATUS</th>
              <th className="px-8 py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5EA]">
            {reports.map((report) => (
              <motion.tr 
                key={report.id}
                whileHover={{ backgroundColor: 'rgba(245, 245, 247, 0.5)' }}
                onClick={() => onRowClick(report.id)}
                className="cursor-pointer transition-colors border-b border-[#E5E5EA]/50 last:border-0"
              >
                <td className="px-8 py-5">
                  <span className="font-black text-[#1D1D1F] uppercase italic tracking-tighter">{report.company}</span>
                </td>
                <td className="px-8 py-5 text-[#6E6E73] font-medium italic">{report.featuresFound} VECTORS</td>
                <td className="px-8 py-5 text-[#6E6E73] font-medium italic">{report.sources} SIGNALS</td>
                <td className="px-8 py-5 text-[#6E6E73] font-medium italic text-xs">{report.time}</td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    report.status === 'Completed' ? "border-[#34C759]/20 text-[#34C759] bg-[#34C759]/5" : 
                    report.status === 'Processing' ? "border-[#0071E3]/20 text-[#0071E3] bg-[#0071E3]/5" : "border-red-500/20 text-red-500 bg-red-500/5"
                  )}>
                    {report.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <ChevronRight size={18} className="text-[#E5E5EA] inline group-hover:text-[#0071E3] transition-colors" />
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
