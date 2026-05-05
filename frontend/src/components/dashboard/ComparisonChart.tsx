import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ComparisonData {
  name: string;
  features: number;
  color: string;
}

interface ComparisonChartProps {
  data: ComparisonData[];
  title: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, title }) => {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-apple h-full">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-foreground leading-tight">{title}</h3>
        <p className="text-muted-foreground text-sm font-medium mt-1">Feature releases this month</p>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="opacity-10" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontWeight: 600, fontSize: 13 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: 'currentColor', opacity: 0.1 }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderRadius: '16px', 
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="features" 
              radius={[0, 10, 10, 0]} 
              barSize={32}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonChart;
