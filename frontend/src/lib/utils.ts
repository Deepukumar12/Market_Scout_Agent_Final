
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const colorRegistry = new Map<string, string>();
let colorIdx = 0;

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
  
  const normalized = name.trim().toLowerCase();
  if (colorRegistry.has(normalized)) {
    return colorRegistry.get(normalized)!;
  }
  
  const color = colors[colorIdx % colors.length];
  colorRegistry.set(normalized, color);
  colorIdx++;
  return color;
}

export function getCompetitorColorId(name: string): string {
  return `color-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
}
