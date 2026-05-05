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
    <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA] shadow-apple h-full">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-[#1D1D1F] leading-tight">{title}</h3>
        <p className="text-[#6E6E73] text-sm font-medium mt-1">Feature releases this month</p>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F5F5F7" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#1D1D1F', fontWeight: 600, fontSize: 13 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#F5F5F7' }}
              contentStyle={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: '16px', 
                border: '1px solid #E5E5EA',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
              }}
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
