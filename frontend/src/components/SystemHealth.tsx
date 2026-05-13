"use client";

import { useEffect, useState } from "react";
import { orbiterWS } from "@/lib/websocket";
import { Activity, ShieldCheck, Database, Server } from "lucide-react";

export default function SystemHealth() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "reconnecting">("disconnected");
  
  useEffect(() => {
    const unsubscribe = orbiterWS.onEvent((event) => {
      if (event.type === "connected") {
        setStatus("connected");
      }
    });

    // Check initial state if possible (or wait for first event)
    // For now we assume disconnected until proven otherwise
    
    return () => unsubscribe();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "connected": return "#34d399"; // Success
      case "reconnecting": return "#fbbf24"; // Warning
      case "disconnected": return "#f87171"; // Error
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: getStatusColor() }} 
        />
        <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
          System: {status}
        </span>
      </div>
      
      <div className="h-4 w-[1px] bg-white/10" />
      
      <div className="flex items-center gap-3">
        <HealthItem icon={Server} label="API" active={status === "connected"} />
        <HealthItem icon={Database} label="DB" active={status === "connected"} />
        <HealthItem icon={ShieldCheck} label="Sec" active={status === "connected"} />
      </div>
    </div>
  );
}

function HealthItem({ icon: Icon, label, active }: { icon: any, label: string, active: boolean }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${active ? 'Active' : 'Offline'}`}>
      <Icon size={12} className={active ? "text-emerald-400" : "text-white/20"} />
      <span className={`text-[10px] font-semibold ${active ? "text-white/80" : "text-white/20"}`}>
        {label}
      </span>
    </div>
  );
}
