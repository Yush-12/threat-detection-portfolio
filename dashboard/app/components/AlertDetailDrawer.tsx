import { X, ShieldAlert, CheckCircle, Clock, CheckCircle2, AlertTriangle, FileJson } from 'lucide-react';
import { useState } from 'react';

interface AlertDetailDrawerProps {
  alert: any | null;
  onClose: () => void;
  onStatusChange: (alertId: string, newStatus: string) => void;
}

export function AlertDetailDrawer({ alert, onClose, onStatusChange }: AlertDetailDrawerProps) {
  const [updating, setUpdating] = useState(false);

  if (!alert) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onStatusChange(alert._id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-neutral-950 h-full border-l border-neutral-800 shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Alert Details</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider
              ${alert.severity?.toLowerCase() === 'critical' ? 'bg-red-600/20 text-red-300 border border-red-400/30' : ''}
              ${alert.severity?.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
              ${alert.severity?.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : ''}
              ${alert.severity?.toLowerCase() === 'low' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
            `}>
              {alert.severity?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Summary */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-2">{alert.rule_title}</h3>
            <p className="text-sm text-neutral-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Status Controls */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wider">Triage Status</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate('open')}
                disabled={updating || alert.status === 'open'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'open' ? 'bg-neutral-800 border-neutral-600 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Open
              </button>
              <button
                onClick={() => handleStatusUpdate('investigating')}
                disabled={updating || alert.status === 'investigating'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'investigating' ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-indigo-500/30'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-indigo-400" /> Investigating
              </button>
              <button
                onClick={() => handleStatusUpdate('resolved')}
                disabled={updating || alert.status === 'resolved'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'resolved' ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolved
              </button>
              <button
                onClick={() => handleStatusUpdate('false_positive')}
                disabled={updating || alert.status === 'false_positive'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'false_positive' ? 'bg-neutral-800 border-neutral-600 text-neutral-200' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <X className="w-4 h-4 text-neutral-500" /> False Positive
              </button>
            </div>
          </div>

          {/* MITRE Details */}
          {alert.mitre_enrichment && alert.mitre_enrichment.technique_id && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">MITRE ATT&CK Context</h4>
                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-xs border border-indigo-500/20 font-mono">
                  {alert.mitre_enrichment.technique_id}
                </span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-white mb-1">{alert.mitre_enrichment.name}</p>
                <p className="text-xs text-indigo-300 mb-2">{alert.mitre_enrichment.tactic}</p>
                <p className="text-sm text-neutral-400 leading-relaxed">{alert.mitre_enrichment.description}</p>
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <h5 className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">Remediation Guidance</h5>
                <p className="text-sm text-neutral-400 leading-relaxed">{alert.mitre_enrichment.remediation}</p>
              </div>
            </div>
          )}

          {/* Raw Log JSON */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <FileJson className="w-4 h-4" />
              Raw Event Log
            </h4>
            <div className="bg-[#0d0d0d] border border-neutral-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-indigo-300 font-mono leading-relaxed">
                {JSON.stringify(alert.hit_log, null, 2)}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
