import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface SeverityChartProps {
  metrics: {
    alert_counts_by_severity: Record<string, number>;
  } | null;
}

const severityColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  UNKNOWN: '#6b7280'
};

export function SeverityChart({ metrics }: SeverityChartProps) {
  const severityData = metrics?.alert_counts_by_severity
    ? Object.entries(metrics.alert_counts_by_severity).map(([key, value]) => ({
        name: String(key),
        value: Number(value),
        fill: severityColors[key] || severityColors.UNKNOWN
      }))
    : [];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-2">
      <h3 className="text-lg font-semibold mb-6 text-neutral-200">Alerts by Severity</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={severityData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
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
      <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-neutral-400">
        {severityData.map(s => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }} />
            {s.name} ({s.value})
          </div>
        ))}
      </div>
    </div>
  );
}
