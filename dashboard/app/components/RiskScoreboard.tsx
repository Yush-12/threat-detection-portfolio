import { useEffect, useState } from 'react';
import { ShieldAlert, User, Globe, AlertTriangle } from 'lucide-react';

interface EntityRisk {
  entity_id: string;
  type: 'user' | 'ip';
  score: number;
  alert_count: number;
  critical_count: number;
  high_count: number;
  top_technique: string;
}

export function RiskScoreboard() {
  const [data, setData] = useState<EntityRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/risk')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl h-64 animate-pulse flex items-center justify-center">
      <p className="text-neutral-500">Loading Risk Scores...</p>
    </div>
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Top Risky Entities
          </h3>
          <p className="text-xs text-neutral-500 mt-1">Users & IPs ranked by alert severity & MITRE coverage</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
        {data.map((entity, idx) => (
          <div key={entity.entity_id} className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-red-500/30 hover:bg-neutral-900 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${idx === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                  idx < 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-neutral-800 text-neutral-400'}
              `}>
                #{idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {entity.type === 'user' ? <User className="w-3.5 h-3.5 text-indigo-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="font-mono text-xs font-bold text-neutral-200">{entity.entity_id}</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 flex gap-2">
                  <span>{entity.alert_count} alerts</span>
                  {(entity.critical_count > 0 || entity.high_count > 0) && (
                    <span className="text-red-400/80">({entity.critical_count}C / {entity.high_count}H)</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-0.5">
              <span className="text-lg font-black tracking-tighter text-white">
                {entity.score}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                {entity.top_technique}
              </span>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No entities found
          </div>
        )}
      </div>
    </div>
  );
}
