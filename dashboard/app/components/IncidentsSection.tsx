"use client";

import { useMemo } from 'react';
import { Flame, User, Globe, ArrowRight } from 'lucide-react';
import type { Incident } from '../lib/siem-engine';

interface IncidentsSectionProps {
  incidents?: Incident[];
  onEntityClick: (entity: { id: string; type: 'user' | 'ip' }) => void;
}

export function IncidentsSection({ incidents = [], onEntityClick }: IncidentsSectionProps) {
  // Guarantee Critical incidents appear first, then High, then Medium
  const sortedIncidents = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];
    const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...incidents].sort((a, b) => {
      const diff = (rank[b.severity.toLowerCase()] || 0) - (rank[a.severity.toLowerCase()] || 0);
      if (diff !== 0) return diff;
      return b.alert_count - a.alert_count;
    });
  }, [incidents]);

  if (sortedIncidents.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active Security Incidents</h3>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                {sortedIncidents.length} CORRELATED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Multi-stage coordinated attack campaigns grouped across detection rules</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedIncidents.slice(0, 6).map((inc) => {
          const isCritical = inc.severity.toLowerCase() === 'critical';
          return (
            <div
              key={inc.incident_id}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isCritical 
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/40 hover:border-rose-300 dark:hover:border-rose-500 shadow-sm' 
                  : 'bg-slate-50 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700">
                    {inc.incident_id}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    isCritical 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30'
                  }`}>
                    {inc.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {inc.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-neutral-400 mb-3 leading-relaxed">
                  {inc.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => onEntityClick({ id: inc.entity_id, type: inc.entity_type })}
                  className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono font-semibold transition-colors group"
                >
                  {inc.entity_type === 'user' ? <User className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  <span>{inc.entity_id}</span>
                  <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-neutral-400">
                  {inc.alert_count} alerts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
