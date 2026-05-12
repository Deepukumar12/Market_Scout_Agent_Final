import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';

import { getCompetitorColor, getCompetitorColorId } from '@/utils/utils';

interface FeatureChartProps {
  data: any[];
  competitors?: string[];
}

const FeatureChart: React.FC<FeatureChartProps> = ({ data, competitors }) => {
  return (
    <div className="bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-[#E5E5EA] dark:border-white/10 shadow-apple h-[450px] w-full overflow-hidden group relative">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase italic tracking-tighter leading-none">Feature Release <span className="text-[#0071E3]">Timeline</span></h3>
          <p className="text-[#6E6E73] dark:text-[#86868B] text-[10px] font-black uppercase tracking-widest mt-2 italic opacity-60">Innovation trends across top competitors</p>
        </div>
        <a 
          href="/api/v1/intelligence/innovation-trends" 
          target="_blank"
          className="p-3 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 text-[#86868B] hover:text-[#0071E3] transition-all opacity-0 group-hover:opacity-100"
        >
          <TrendingUp size={18} />
        </a>
      </div>
      
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ bottom: 40, left: 10, right: 10 }}>
            <defs>
              {competitors?.map(comp => (
                <linearGradient key={getCompetitorColorId(comp)} id={getCompetitorColorId(comp)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getCompetitorColor(comp)} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={getCompetitorColor(comp)} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} className="text-[#86868B] dark:text-[#48484A]" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 700 }}
              className="text-[#86868B] dark:text-[#A1A1A6]"
              dy={15}
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
              className="text-[#86868B] dark:text-[#A1A1A6]"
              allowDecimals={false}
              domain={[0, 'auto']}
              tickCount={6}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255,255,255,0.95)', 
                borderColor: 'rgba(229, 229, 234, 0.5)',
                color: '#1D1D1F',
                borderRadius: '24px', 
                border: '1px solid rgba(229, 229, 234, 0.5)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              itemStyle={{ fontWeight: '900', color: '#1D1D1F' }}
              labelStyle={{ color: '#86868B', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} 
            />
            {competitors?.map((comp) => (
              <Area 
                key={comp}
                type="monotone" 
                dataKey={comp} 
                stroke={getCompetitorColor(comp)} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#${getCompetitorColorId(comp)})`} 
                activeDot={{ r: 6, stroke: getCompetitorColor(comp), strokeWidth: 3, fill: '#ffffff' }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeatureChart;
