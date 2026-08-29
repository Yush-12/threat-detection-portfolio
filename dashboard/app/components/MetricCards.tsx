import { Activity, ShieldAlert } from 'lucide-react';

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
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Total Alerts</p>
            <p className="text-3xl font-bold text-white">{metrics?.total_alerts || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">High/Critical Alerts</p>
            <p className="text-3xl font-bold text-white">{highCriticalAlerts}</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50">
        <div className="flex flex-col justify-center h-full">
           <p className="text-sm font-medium text-neutral-400 mb-1">Last Run Timestamp</p>
           <p className="text-lg font-mono text-indigo-300">
             {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString() : 'N/A'}
           </p>
        </div>
      </div>
    </div>
  );
}
