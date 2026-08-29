import { useState, useMemo } from 'react';

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
  alerts: any[];
  onFilterChange?: (techniqueId: string | null) => void;
}

export function MitreHeatmap({ alerts, onFilterChange }: MitreHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // Compute technique frequencies and map them to tactics
  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, { name: string; count: number }>> = {};
    
    // Initialize tactics
    MITRE_TACTICS.forEach(tactic => {
      data[tactic] = {};
    });

    alerts.forEach(alert => {
      const enrichment = alert.mitre_enrichment;
      if (enrichment && enrichment.tactic && enrichment.technique_id) {
        const tactic = enrichment.tactic;
        const techId = enrichment.technique_id;
        
        if (!data[tactic]) data[tactic] = {};
        
        if (!data[tactic][techId]) {
          data[tactic][techId] = { name: enrichment.name, count: 0 };
        }
        data[tactic][techId].count += 1;
      }
    });

    return data;
  }, [alerts]);

  const maxCount = useMemo(() => {
    let max = 0;
    Object.values(heatmapData).forEach(tacticGroup => {
      Object.values(tacticGroup).forEach(tech => {
        if (tech.count > max) max = tech.count;
      });
    });
    return max || 1; // avoid div by 0
  }, [heatmapData]);

  const handleCellClick = (techId: string) => {
    if (selectedCell === techId) {
      setSelectedCell(null);
      onFilterChange?.(null);
    } else {
      setSelectedCell(techId);
      onFilterChange?.(techId);
    }
  };

  // Helper to determine cell color based on intensity
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-neutral-800/50 border-neutral-700/50 text-neutral-600';
    
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    if (intensity > 0.5) return 'bg-orange-500 border-orange-400 text-white';
    if (intensity > 0.2) return 'bg-yellow-500 border-yellow-400 text-neutral-900';
    return 'bg-indigo-500/50 border-indigo-500 text-indigo-100';
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 overflow-hidden animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-200">MITRE ATT&CK® Matrix</h3>
          <p className="text-xs text-neutral-500 mt-1">Techniques covered by triggered alerts</p>
        </div>
        {selectedCell && (
          <button 
            onClick={() => handleCellClick(selectedCell)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-2 min-w-max">
          {MITRE_TACTICS.map(tactic => {
            const techniques = heatmapData[tactic] || {};
            const techIds = Object.keys(techniques).sort();
            
            // Only render columns that have at least one technique (to save space)
            // or render all if we want the full grid feel. Let's render all for the real matrix look.
            return (
              <div key={tactic} className="flex flex-col gap-2 w-36 flex-shrink-0">
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-center h-12 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-tighter leading-tight">
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
                          border rounded-lg p-2 cursor-pointer transition-all duration-200
                          ${getCellColor(tech.count)}
                          ${isFaded ? 'opacity-30' : 'opacity-100'}
                          ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'hover:scale-[1.02]'}
                        `}
                        title={`${techId}: ${tech.name} (${tech.count} alerts)`}
                      >
                        <div className="text-[10px] font-mono font-bold opacity-80 mb-1">{techId}</div>
                        <div className="text-xs font-medium leading-tight line-clamp-3">{tech.name}</div>
                        <div className="text-[10px] mt-2 font-bold opacity-90">{tech.count} hits</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-dashed border-neutral-800/50 rounded-lg p-2 h-16 flex items-center justify-center opacity-30">
                    <span className="text-[10px] text-neutral-600">No data</span>
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
