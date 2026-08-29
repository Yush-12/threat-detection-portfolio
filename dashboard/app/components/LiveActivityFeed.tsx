"use client";

import { ChevronRight } from 'lucide-react';
import type { Alert } from '../lib/siem-engine';

interface LiveActivityFeedProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

export function LiveActivityFeed({ alerts, onAlertClick }: LiveActivityFeedProps) {
  const recentAlerts = alerts.slice(0, 10);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up stagger-3 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-200">Live Threat Feed</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Real-time incoming security events</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400">
            STREAM ACTIVE
          </span>
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
        {recentAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-neutral-500 font-mono">
            Awaiting incoming telemetry...
          </div>
        ) : (
          recentAlerts.map((alert, idx) => {
            const sev = (alert.severity || 'low').toLowerCase();
            const badgeColor =
              sev === 'critical' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300' :
              sev === 'high' ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-500/40 text-orange-800 dark:text-orange-300' :
              sev === 'medium' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300' :
              'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-500/40 text-blue-800 dark:text-blue-300';

            return (
              <div
                key={alert._id || idx}
                onClick={() => onAlertClick(alert)}
                className={`p-2.5 rounded-xl border ${badgeColor} hover:brightness-95 dark:hover:bg-neutral-800/80 transition-all cursor-pointer group flex items-center justify-between gap-3 text-xs`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {alert.rule_title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                    <span>{alert.hit_log?.user || alert.hit_log?.ip_address || 'System'}</span>
                    <span>•</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}
