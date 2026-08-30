"use client";

import { X, ShieldAlert, Clock, CheckCircle2, AlertTriangle, FileJson, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSeverityBadgeColors } from '../lib/utils';
import type { Alert } from '../lib/siem-engine';

const getMitreUrl = (techId: string) => {
  const formatted = techId.replace('.', '/');
  return `https://attack.mitre.org/techniques/${formatted}/`;
};

interface AlertDetailDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onStatusChange: (alertId: string, newStatus: Alert['status']) => void;
}

export function AlertDetailDrawer({ alert, onClose, onStatusChange }: AlertDetailDrawerProps) {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!alert) return;
    
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [alert, onClose]);

  if (!alert) return null;

  const handleStatusUpdate = async (newStatus: Alert['status']) => {
    setUpdating(true);
    try {
      if (alert._id) {
        await onStatusChange(alert._id, newStatus);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-neutral-950 h-full border-l border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-slide-in-right cursor-default"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <h2 id="drawer-title" className="text-lg font-bold text-slate-900 dark:text-white">Alert Details</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider ${getSeverityBadgeColors(alert.severity)}`}>
              {alert.severity?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close drawer" className="p-2 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Summary */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{alert.rule_title}</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 flex items-center gap-2 font-mono">
              <Clock className="w-4 h-4" />
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Status Controls */}
          <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-500 dark:text-neutral-300 mb-3 uppercase tracking-wider">Triage Status</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate('open')}
                disabled={updating || alert.status === 'open'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'open' ? 'bg-orange-50 dark:bg-neutral-800 border-orange-300 dark:border-neutral-600 text-orange-800 dark:text-white font-bold' : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-orange-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Open
              </button>
              <button
                onClick={() => handleStatusUpdate('investigating')}
                disabled={updating || alert.status === 'investigating'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'investigating' ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-500/50 text-indigo-800 dark:text-indigo-300 font-bold' : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-indigo-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-indigo-500" /> Investigating
              </button>
              <button
                onClick={() => handleStatusUpdate('resolved')}
                disabled={updating || alert.status === 'resolved'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'resolved' ? 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolved
              </button>
              <button
                onClick={() => handleStatusUpdate('false_positive')}
                disabled={updating || alert.status === 'false_positive'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  alert.status === 'false_positive' ? 'bg-slate-200 dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 text-slate-800 dark:text-neutral-200 font-bold' : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
                }`}
              >
                <X className="w-4 h-4 text-slate-500" /> False Positive
              </button>
            </div>
          </div>

          {/* MITRE Details */}
          {alert.mitre_enrichment && alert.mitre_enrichment.technique_id && (
            <div className="bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 dark:text-neutral-300 uppercase tracking-wider">MITRE ATT&CK Context</h4>
                <a
                  href={getMitreUrl(alert.mitre_enrichment.technique_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs border border-indigo-200 dark:border-indigo-500/30 font-mono transition-all group font-semibold"
                  title={`Open ${alert.mitre_enrichment.technique_id} on official MITRE ATT&CK website`}
                >
                  <span>{alert.mitre_enrichment.technique_id}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
              
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{alert.mitre_enrichment.name}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-300 font-mono font-semibold mb-2">{alert.mitre_enrichment.tactic}</p>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">{alert.mitre_enrichment.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-neutral-800">
                <h5 className="text-xs font-bold text-slate-500 dark:text-neutral-300 mb-2 uppercase tracking-wider">Remediation Guidance</h5>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">{alert.mitre_enrichment.remediation}</p>
              </div>
            </div>
          )}

          {/* Raw Log JSON */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-neutral-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <FileJson className="w-4 h-4" />
              Raw Event Log
            </h4>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto shadow-inner">
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
