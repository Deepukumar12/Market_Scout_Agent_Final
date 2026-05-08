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
import { useTheme } from '@/context/ThemeContext';

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, title }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-[#E5E5EA] dark:border-white/10 shadow-apple h-full">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white leading-tight">{title}</h3>
        <p className="text-[#6E6E73] dark:text-[#86868B] text-sm font-medium mt-1">Feature releases this month</p>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "#2C2C2E" : "#F5F5F7"} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: isDark ? '#A1A1A6' : '#1D1D1F', fontWeight: 600, fontSize: 13 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: isDark ? '#2C2C2E' : '#F5F5F7' }}
              contentStyle={{ 
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', 
                borderRadius: '16px', 
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E5EA',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
              }}
              itemStyle={{ color: isDark ? '#FFFFFF' : '#1D1D1F' }}
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
