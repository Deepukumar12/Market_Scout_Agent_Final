import React from 'react';
import { motion } from 'framer-motion';

interface CircularGaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#0071E3',
  label,
  sublabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* -- Ring + centred percentage -- */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-100 dark:text-white/10"
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Percentage - absolutely centred inside ring */}
        {label && (
          <span
            className="absolute font-black text-[#1D1D1F] dark:text-white leading-none italic tracking-tighter select-none"
            style={{ fontSize: size * 0.24 }}
          >
            {value}%
          </span>
        )}
      </div>

      {/* -- Sublabel - always BELOW the ring, never inside -- */}
      {sublabel && (
        <span
          className="font-black text-[#86868B] uppercase tracking-[0.18em] opacity-75 whitespace-nowrap select-none"
          style={{ fontSize: Math.max(9, size * 0.11) }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default React.memo(CircularGauge);
