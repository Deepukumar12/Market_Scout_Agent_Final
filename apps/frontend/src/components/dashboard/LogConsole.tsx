import { useEffect, useRef, useState } from 'react';
import { Terminal, Minimize2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/Button';
import { formatTimeToIST } from '@/utils/dateUtils';
import { useAuthStore } from '@/store/authStore';
import { useExecutionStore } from '@/store/executionStore';

interface LogEntry {
  message: string;
  category: 'AGENT' | 'SYSTEM' | 'RISK_ENGINE';
  timestamp: string;
}

// WebSocket must connect to the backend. In dev, Vite proxies /ws to backend; fallback to direct backend URL.
const getWsBase = () => {
  const env = (import.meta as any).env.VITE_WS_URL;
  if (env) {
    const stripped = env.replace(/\/ws\/logs\/?$/, '').replace(/\/ws\/notifications\/?$/, '');
    return stripped.replace(/^http/, 'ws');
  }
  if ((import.meta as any).env.DEV) return 'ws://localhost:8000';
  
  const apiUrl = (import.meta as any).env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/^http/, 'ws');
  }
  const { protocol, host } = window.location;
  return protocol === 'https:' ? `wss://${host}` : `ws://${host}`;
};

export default function LogConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (!active) return;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (socket) {
        socket.onclose = null;
        socket.close();
      }

      const wsBase = getWsBase();
      const url = token 
        ? `${wsBase}/ws/logs?token=${encodeURIComponent(token)}`
        : `${wsBase}/ws/logs`;
      
      socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        if (!active) return;
        const entry: LogEntry = {
          message: "Connected to ScoutForge AI Agent Network...",
          category: "SYSTEM",
          timestamp: new Date().toISOString()
        };
        setLogs((prev) => [...prev, entry]);
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          const entry: LogEntry = data;
          setLogs((prev) => [...prev.slice(-100), entry]);
          
          const { addLog, setStep } = useExecutionStore.getState();
          addLog(entry);

          const phaseMatch = entry.message.match(/Phase (\d+)/);
          if (phaseMatch) {
            const phase = parseInt(phaseMatch[1]);
            setStep(phase - 1);
          }
        } catch (e) {
          const entry: LogEntry = {
            message: event.data,
            category: "SYSTEM",
            timestamp: new Date().toISOString()
          };
          setLogs((prev) => [...prev.slice(-100), entry]);
          useExecutionStore.getState().addLog(entry);
        }
      };

      socket.onclose = () => {
        if (!active) return;
        const entry: LogEntry = {
          message: "Connection closed.",
          category: "SYSTEM",
          timestamp: new Date().toISOString()
        };
        setLogs((prev) => [...prev, entry]);

        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        if (!active) return;
        const entry: LogEntry = {
          message: "WebSocket error.",
          category: "SYSTEM",
          timestamp: new Date().toISOString()
        };
        setLogs((prev) => [...prev, entry]);
      };
    };

    connect();

    const handleOnline = () => {
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connect();
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.onclose = null;
        if (socket.readyState === WebSocket.CONNECTING) {
          const s = socket;
          s.onopen = () => s.close();
        } else if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }
      if (ws.current === socket) {
        ws.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (bottomRef.current && isOpen) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) {
    return (
      <Button 
        variant="neon" 
        size="sm" 
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Terminal className="w-4 h-4 mr-2" /> Live Logs
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg bg-black/90 border border-cyan-500/30 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden flex flex-col transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-cyan-950/20 border-b border-cyan-500/20">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
          <Terminal className="w-3 h-3" />
          <span>AGENT EXECUTION LOGS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse ml-2"></span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <Minimize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
        {logs.map((log, i) => (
          <div key={i} className={cn(
            "break-all border-l-2 pl-2",
            log.category === "SYSTEM" ? "border-blue-500 text-blue-400" :
            log.category === "RISK_ENGINE" ? "border-red-500 text-red-400" :
            log.category === "AGENT" ? "border-green-500 text-green-400" :
            "border-gray-700 text-gray-500"
          )}>
            <span className="opacity-50 mr-2">[{formatTimeToIST(log.timestamp)}]</span>
            <span className="font-bold mr-2">{log.category}:</span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
