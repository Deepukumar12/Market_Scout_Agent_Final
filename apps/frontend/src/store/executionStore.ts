import { create } from 'zustand';

interface ExecutionLog {
  message: string;
  category: 'AGENT' | 'SYSTEM' | 'RISK_ENGINE';
  timestamp: string;
}

interface ExecutionState {
  logs: ExecutionLog[];
  isExecuting: boolean;
  currentStep: number;
  totalSteps: number;
  addLog: (log: ExecutionLog) => void;
  startExecution: (totalSteps?: number) => void;
  stopExecution: () => void;
  setStep: (step: number | ((prev: number) => number)) => void;
  clearLogs: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  logs: [],
  isExecuting: false,
  currentStep: 0,
  totalSteps: 5,
  addLog: (log) => set((state) => ({ logs: [...state.logs.slice(-100), log] })),
  startExecution: (totalSteps = 5) => set({ isExecuting: true, currentStep: 0, totalSteps, logs: [] }),
  stopExecution: () => set({ isExecuting: false }),
  setStep: (step) => set((state) => ({ 
    currentStep: typeof step === 'function' ? step(state.currentStep) : step 
  })),
  clearLogs: () => set({ logs: [] }),
}));
