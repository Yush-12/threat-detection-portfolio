import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface SeverityChartProps {
  metrics: {
    total_alerts?: number;
    alert_counts_by_severity: Record<string, number>;
    alert_counts_by_status?: Record<string, number>;
  } | null;
}

const severityColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  UNKNOWN: '#6b7280'
};

const statusStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  open: { label: 'Open', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
  investigating: { label: 'Investigating', bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  false_positive: { label: 'False Positive', bg: 'bg-neutral-800 border-neutral-700', text: 'text-neutral-400', dot: 'bg-neutral-500' },
};

export function SeverityChart({ metrics }: SeverityChartProps) {
  const severityData = metrics?.alert_counts_by_severity
    ? Object.entries(metrics.alert_counts_by_severity).map(([key, value]) => ({
        name: String(key),
        value: Number(value),
        fill: severityColors[key] || severityColors.UNKNOWN
      }))
    : [];

  const totalAlerts = metrics?.total_alerts || severityData.reduce((acc, d) => acc + d.value, 0) || 0;
  const statusCounts = metrics?.alert_counts_by_status || {};

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-2 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-200">Alerts by Severity</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Distribution across severity levels</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400">
            {totalAlerts} Total
          </span>
        </div>

        {/* Donut Chart */}
        <div className="h-48 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '0.5rem', color: '#f5f5f5' }}
                itemStyle={{ color: '#f5f5f5' }}
                cursor={{ fill: 'transparent' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
            const s = severityData.find(d => d.name === level);
            if (!s) return null;
            return (
              <div key={s.name} className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                <span>{s.name}</span>
                <span className="text-neutral-400 font-mono text-[11px]">({s.value})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Triage Status Distribution */}
      <div className="mt-6 pt-4 border-t border-neutral-800/60">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Triage Workflow Status</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(statusStyles).map(([key, style]) => {
            const count = statusCounts[key] || 0;
            const pct = totalAlerts > 0 ? Math.round((count / totalAlerts) * 100) : 0;
            return (
              <div key={key} className={`p-2.5 rounded-xl border ${style.bg} flex flex-col justify-between`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span className="text-[10px] uppercase font-bold tracking-tight text-neutral-400 truncate">{style.label}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-base font-black ${style.text}`}>{count}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
