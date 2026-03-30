
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getCompetitorColor(name: string): string {
  if (!name) return '#86868B';
  const colors = [
    '#0071E3', // Apple Blue
    '#AF52DE', // Apple Purple
    '#FF9500', // Apple Orange
    '#34C759', // Apple Green
    '#FF3B30', // Apple Red
    '#5856D6', // Apple Indigo
    '#00C7BE', // Apple Teal
    '#FF2D55', // Apple Pink
  ];
  
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function getCompetitorColorId(name: string): string {
  return `color-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
}
