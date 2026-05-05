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

import { getCompetitorColor, getCompetitorColorId } from '@/lib/utils';

interface FeatureChartProps {
  data: any[];
  competitors?: string[];
}

const FeatureChart: React.FC<FeatureChartProps> = ({ data, competitors }) => {
  return (
    <div className="bg-card/70 backdrop-blur-xl p-8 rounded-[40px] border border-border shadow-apple h-[450px] w-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Feature Release <span className="text-primary">Timeline</span></h3>
          <p className="text-muted-foreground text-sm font-medium italic">Innovation trends across top competitors</p>
        </div>
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 9, fontWeight: 700 }}
              dy={15}
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                backdropFilter: 'blur(12px)',
                borderRadius: '16px', 
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              itemStyle={{ fontWeight: 'bold' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}
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
