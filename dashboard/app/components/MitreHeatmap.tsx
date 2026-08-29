"use client";

import { useState, useMemo } from 'react';
import type { Alert, DashboardMetrics } from '../lib/siem-engine';

// The 14 MITRE ATT&CK Tactics in order
const MITRE_TACTICS = [
  'Reconnaissance',
  'Resource Development',
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact'
];

interface MitreHeatmapProps {
  alerts?: Alert[];
  metrics?: DashboardMetrics | null;
  selectedTechnique?: string | null;
  onFilterChange?: (techniqueId: string | null) => void;
}

export function MitreHeatmap({ alerts, metrics, selectedTechnique, onFilterChange }: MitreHeatmapProps) {
  const [internalSelectedCell, setInternalSelectedCell] = useState<string | null>(null);
  const selectedCell = selectedTechnique !== undefined ? selectedTechnique : internalSelectedCell;

  // Compute technique frequencies and map them to tactics
  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, { name: string; count: number; severity: string }>> = {};
    
    MITRE_TACTICS.forEach(tactic => {
      data[tactic] = {};
    });

    if (metrics?.mitre_techniques && Object.keys(metrics.mitre_techniques).length > 0) {
      Object.entries(metrics.mitre_techniques).forEach(([techId, info]) => {
        const tactic = info.tactic || 'Unknown';
        if (!data[tactic]) data[tactic] = {};
        data[tactic][techId] = { 
          name: info.name, 
          count: info.count,
          severity: (info.max_severity || 'LOW').toUpperCase()
        };
      });
    } else if (alerts) {
      alerts.forEach(alert => {
        const enrichment = alert.mitre_enrichment;
        if (enrichment && enrichment.tactic && enrichment.technique_id) {
          const tactic = enrichment.tactic;
          const techId = enrichment.technique_id;
          const sev = (alert.severity || 'LOW').toUpperCase();
          
          if (!data[tactic]) data[tactic] = {};
          
          if (!data[tactic][techId]) {
            data[tactic][techId] = { name: enrichment.name || 'Unknown', count: 0, severity: sev };
          } else {
            const rank: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            if ((rank[sev] || 0) > (rank[data[tactic][techId].severity] || 0)) {
              data[tactic][techId].severity = sev;
            }
          }
          data[tactic][techId].count += 1;
        }
      });
    }

    return data;
  }, [metrics, alerts]);

  const handleCellClick = (techId: string) => {
    if (selectedCell === techId) {
      setInternalSelectedCell(null);
      onFilterChange?.(null);
    } else {
      setInternalSelectedCell(techId);
      onFilterChange?.(techId);
    }
  };

  const getCellColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-100 hover:border-rose-500 dark:hover:border-rose-400';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-500/50 text-orange-900 dark:text-orange-100 hover:border-orange-500 dark:hover:border-orange-400';
      case 'MEDIUM':
        return 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 hover:border-amber-500 dark:hover:border-amber-400';
      case 'LOW':
      default:
        return 'bg-sky-50 dark:bg-blue-950/50 border-sky-300 dark:border-blue-500/40 text-sky-900 dark:text-blue-100 hover:border-sky-500 dark:hover:border-blue-400';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-200">MITRE ATT&CK® Matrix</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Color-coded by highest detected severity level</p>
        </div>
        {selectedCell && (
          <button 
            onClick={() => handleCellClick(selectedCell)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-2.5 min-w-max">
          {[...MITRE_TACTICS].sort((a, b) => {
            const aHasData = Object.keys(heatmapData[a] || {}).length > 0;
            const bHasData = Object.keys(heatmapData[b] || {}).length > 0;
            if (aHasData && !bHasData) return -1;
            if (!aHasData && bHasData) return 1;
            return MITRE_TACTICS.indexOf(a) - MITRE_TACTICS.indexOf(b);
          }).map(tactic => {
            const techniques = heatmapData[tactic] || {};
            const techIds = Object.keys(techniques).sort();
            
            return (
              <div key={tactic} className="flex flex-col gap-2 w-40 flex-shrink-0">
                <div className="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg p-2 text-center h-12 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-300 uppercase tracking-tight leading-tight">
                    {tactic}
                  </span>
                </div>
                
                {techIds.length > 0 ? (
                  techIds.map(techId => {
                    const tech = techniques[techId];
                    const isSelected = selectedCell === techId;
                    const isFaded = selectedCell && !isSelected;
                    
                    return (
                      <div 
                        key={techId}
                        onClick={() => handleCellClick(techId)}
                        className={`
                          border rounded-xl p-3 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[92px]
                          ${getCellColor(tech.severity)}
                          ${isFaded ? 'opacity-30' : 'opacity-100'}
                          ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 border-indigo-500' : 'hover:scale-[1.02]'}
                        `}
                        title={`${techId}: ${tech.name} (${tech.count} alerts - ${tech.severity})`}
                      >
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-wider opacity-80 block mb-1">
                            {techId}
                          </span>
                          <span className="text-xs font-semibold leading-snug line-clamp-2 block">
                            {tech.name}
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-black/40 border border-black/10 dark:border-white/10">
                            {tech.count} {tech.count === 1 ? 'hit' : 'hits'}
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80">
                            {tech.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-dashed border-slate-200 dark:border-neutral-800/80 rounded-xl p-3 h-20 flex items-center justify-center opacity-60 bg-slate-50/50 dark:bg-neutral-950/20">
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">No data</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
