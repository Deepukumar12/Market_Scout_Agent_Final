
import { useEffect, useRef, useState } from 'react';
import { Terminal, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function LogConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Only establish a WebSocket connection when we have an auth token
    if (!token) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Use current host (localhost:5173) which proxies to backend
    const url = `${protocol}//${host}/ws/logs?token=${encodeURIComponent(token)}`;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setLogs((prev) => [...prev, "SYSTEM: Connected to ScoutIQ Agent Network..."]);
    };

    ws.current.onmessage = (event) => {
      setLogs((prev) => [...prev.slice(-100), event.data]); // Keep last 100 logs
    };

    ws.current.onclose = () => {
      setLogs((prev) => [...prev, "SYSTEM: Connection closed."]);
    };

    return () => {
      ws.current?.close();
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
            log.includes("SYSTEM") ? "border-blue-500 text-blue-400" :
            log.includes("RISK_ENGINE") ? "border-red-500 text-red-400" :
            log.includes("AGENT") ? "border-green-500 text-green-400" :
            "border-gray-700 text-gray-500"
          )}>
            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
