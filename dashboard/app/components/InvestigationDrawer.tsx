"use client";

import { X, ShieldAlert, Clock, MapPin, Terminal, Layers, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSeverityBadgeColors } from '../lib/utils';
import type { Alert } from '../lib/siem-engine';

interface InvestigationDrawerProps {
  entity: { id: string; type: 'user' | 'ip'; score?: number; label?: string } | null;
  alerts: Alert[];
  onClose: () => void;
}

export function InvestigationDrawer({ entity, alerts: initialAlerts, onClose }: InvestigationDrawerProps) {
  const [fetchedAlerts, setFetchedAlerts] = useState<Alert[] | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!entity) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [entity, onClose]);

  useEffect(() => {
    if (!entity) return;
    
    // Check if the entity already has alerts in the current page view. 
    // If it has fewer than what might exist (we assume > 0 means we might still want to fetch all to be sure,
    // but fetching guarantees we see historical ones not on page 1).
    let isMounted = true;
    const fetchEntityAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/metrics?search=${encodeURIComponent(entity.id)}&limit=200`);
        const json = await res.json();
        if (isMounted && json.alerts) {
          setFetchedAlerts(json.alerts);
        }
      } catch (err) {
        console.error('Failed to fetch entity alerts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchEntityAlerts();
    
    return () => { isMounted = false; };
  }, [entity]);

  const relatedAlerts = useMemo(() => {
    if (!entity) return [];
    
    // Use fetched alerts if available, otherwise fallback to local filter
    if (fetchedAlerts) return fetchedAlerts;
    
    return initialAlerts.filter(a => {
      if (entity.type === 'user') return a.hit_log?.user === entity.id;
      return a.hit_log?.ip_address === entity.id;
    });
  }, [entity, initialAlerts, fetchedAlerts]);

  const stats = useMemo(() => {
    if (!relatedAlerts.length) return null;

    const tactics = Array.from(new Set(relatedAlerts.map(a => a.mitre_enrichment?.tactic).filter(Boolean)));
    const locations = Array.from(new Set(relatedAlerts.map(a => a.hit_log?.location).filter(Boolean)));
    const devices = Array.from(new Set(relatedAlerts.map(a => a.hit_log?.device).filter(Boolean)));
    const criticalCount = relatedAlerts.filter(a => a.severity?.toLowerCase() === 'critical').length;
    const highCount = relatedAlerts.filter(a => a.severity?.toLowerCase() === 'high').length;

    return { tactics, locations, devices, criticalCount, highCount };
  }, [relatedAlerts]);

  if (!entity) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="investigation-title"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-neutral-950 h-full border-l border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-slide-in-right cursor-default overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                  {entity.type.toUpperCase()} INVESTIGATION
                </span>
                {entity.score && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300">
                    Risk Score: {entity.score}
                  </span>
                )}
              </div>
              <h2 id="investigation-title" className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {entity.id}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close drawer" 
            className="p-2 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Quick Metrics */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 text-center shadow-xs">
                  <span className="text-xs text-slate-500 dark:text-neutral-500 block mb-1 font-medium">Total Hits</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{relatedAlerts.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 text-center shadow-xs">
                  <span className="text-xs text-slate-500 dark:text-neutral-500 block mb-1 font-medium">Critical / High</span>
                  <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                    {(stats?.criticalCount || 0) + (stats?.highCount || 0)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 text-center shadow-xs">
                  <span className="text-xs text-slate-500 dark:text-neutral-500 block mb-1 font-medium">Tactics Involved</span>
                  <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{stats?.tactics.length || 0}</span>
                </div>
              </div>

          {/* Observed Context */}
          {stats && (
            <div className="bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-600 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Observed Telemetry
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 dark:text-neutral-500 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Locations Observed:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.locations.map(loc => (
                      <span key={loc} className="px-2 py-0.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-neutral-500 block mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Devices:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.devices.map(d => (
                      <span key={d} className="px-2 py-0.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-neutral-500 block mb-1 text-xs font-mono">MITRE ATT&CK Tactics Detected:</span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.tactics.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs rounded font-mono font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline of Correlated Alerts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Correlated Security Events ({relatedAlerts.length})
            </h4>

            {relatedAlerts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl text-slate-400 dark:text-neutral-500 text-xs font-mono">
                No active security alerts linked to this entity in the current dataset.
              </div>
            ) : (
              <div className="space-y-2.5">
                {relatedAlerts.map((alert, idx) => (
                  <div 
                    key={alert._id || idx}
                    className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl hover:border-slate-300 dark:hover:border-neutral-700 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {alert.rule_title}
                      </span>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${getSeverityBadgeColors(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      {alert.mitre_enrichment?.technique_id && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{alert.mitre_enrichment.technique_id} - {alert.mitre_enrichment.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}

        </div>
      </div>
    </div>
  );
}
