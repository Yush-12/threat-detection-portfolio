import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface MitreBarChartProps {
  metrics: {
    top_mitre_techniques: Record<string, number>;
  } | null;
}

export function MitreBarChart({ metrics }: MitreBarChartProps) {
  const mitreData = metrics?.top_mitre_techniques
    ? Object.entries(metrics.top_mitre_techniques).map(([key, value]) => ({
        technique: String(key),
        count: Number(value)
      }))
    : [];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50">
      <h3 className="text-lg font-semibold mb-6 text-neutral-200">Top MITRE ATT&CK Techniques</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mitreData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
            <XAxis type="number" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey="technique" type="category" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: '#262626' }}
              contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '0.5rem' }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
