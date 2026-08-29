import { Activity, ShieldAlert, Clock } from 'lucide-react';

interface MetricCardsProps {
  metrics: {
    total_alerts: number;
    alert_counts_by_severity: Record<string, number>;
    timestamp: string;
  } | null;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const highCriticalAlerts = 
    (metrics?.alert_counts_by_severity?.HIGH || 0) + 
    (metrics?.alert_counts_by_severity?.CRITICAL || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-1">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-2xl hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Total Alerts</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.total_alerts || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-2xl hover:border-rose-400 dark:hover:border-rose-500/50 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">High/Critical Alerts</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{highCriticalAlerts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-4 h-full">
          <div className="p-3 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-600 dark:text-neutral-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-neutral-400 mb-0.5">Last Run Timestamp</p>
            <p className="text-base font-mono font-semibold text-slate-800 dark:text-indigo-300">
              {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
