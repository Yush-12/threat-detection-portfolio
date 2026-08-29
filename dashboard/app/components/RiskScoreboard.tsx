"use client";

import { useEffect, useState } from 'react';
import { User, Globe, AlertTriangle } from 'lucide-react';

interface EntityRisk {
  entity_id: string;
  type: 'user' | 'ip';
  score: number;
  alert_count: number;
  critical_count: number;
  high_count: number;
  top_technique: string;
}

interface RiskScoreboardProps {
  refreshTrigger?: string | null;
  onEntityClick?: (entity: { id: string; type: 'user' | 'ip'; score?: number }) => void;
}

export function RiskScoreboard({ refreshTrigger, onEntityClick }: RiskScoreboardProps = {}) {
  const [data, setData] = useState<EntityRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/risk')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl h-64 animate-pulse flex items-center justify-center">
      <p className="text-slate-400 dark:text-neutral-500 font-mono text-xs">Loading Risk Scores...</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl h-full hover:shadow-md dark:hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up stagger-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Top Risky Entities
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Click any entity to launch full SOC investigation</p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
        {data.map((entity, idx) => (
          <div 
            key={entity.entity_id}
            onClick={() => onEntityClick?.({ id: entity.entity_id, type: entity.type, score: entity.score })}
            className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-neutral-900/80 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${idx === 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' : 
                  idx < 3 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400'}
              `}>
                #{idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {entity.type === 'user' ? <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-neutral-200">{entity.entity_id}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 flex gap-2 font-mono">
                  <span>{entity.alert_count} alerts</span>
                  {(entity.critical_count > 0 || entity.high_count > 0) && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">({entity.critical_count}C / {entity.high_count}H)</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-0.5">
              <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
                {entity.score}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400 border border-slate-300 dark:border-neutral-700">
                {entity.top_technique}
              </span>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-sm font-mono">
            No entities found
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
