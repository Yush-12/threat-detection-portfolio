"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, Upload, Info, Zap, ShieldAlert } from 'lucide-react';
import { MetricCards } from './components/MetricCards';
import { SeverityChart } from './components/SeverityChart';
import { MitreHeatmap } from './components/MitreHeatmap';
import { RiskScoreboard } from './components/RiskScoreboard';
import { AlertsTable } from './components/AlertsTable';
import { AlertDetailDrawer } from './components/AlertDetailDrawer';

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalAlerts: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DashboardData {
  metrics: any;
  alerts: any[];
  pagination: Pagination;
  error?: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortConfigs, setSortConfigs] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);

  // Action states
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ITEMS_PER_PAGE = 25;

  const fetchData = useCallback(async (
    pageNum: number = 1,
    currentSorts: { key: string; direction: 'asc' | 'desc' }[] = sortConfigs,
    query: string = searchTerm,
    tech: string | null = selectedTechnique
  ) => {
    try {
      setLoading(true);
      const sortStr = encodeURIComponent(JSON.stringify(currentSorts.length > 0 ? currentSorts : [{ key: 'timestamp', direction: 'desc' }]));
      const searchStr = encodeURIComponent(query);
      const techStr = encodeURIComponent(tech || '');
      
      const res = await fetch(`/api/metrics?page=${pageNum}&limit=${ITEMS_PER_PAGE}&sort=${sortStr}&search=${searchStr}&technique=${techStr}`);
      const json = await res.json();
      setData(json);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortConfigs, searchTerm, selectedTechnique]);

  // Initial load and filter change trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, sortConfigs, searchTerm, selectedTechnique);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedTechnique]);

  // Auto-dismiss status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // ─── Generate Logs Handler ─────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ text: json.message, type: 'success' });
        await fetchData(1);
      } else {
        setStatusMessage({ text: json.error || 'Generation failed', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error during generation', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // ─── Upload Logs Handler ───────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (json.success) {
        setStatusMessage({ text: json.message, type: 'success' });
        await fetchData(1);
      } else {
        setStatusMessage({ text: json.error || 'Upload failed', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error during upload', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Pagination Handlers ──────────────────────────────────────────────
  const goToPage = (pageNum: number) => {
    setLoading(true);
    fetchData(pageNum, sortConfigs);
  };

  // ─── Sorting ──────────────────────────────────────────────────────────
  const handleSort = (key: string, isMulti: boolean) => {
    if (loading) return;
    
    setLoading(true);
    let newSorts: { key: string; direction: 'asc' | 'desc' }[] = [];
    
    const existing = sortConfigs.find(s => s.key === key);
    
    if (isMulti) {
      if (existing) {
        if (existing.direction === 'desc') {
          newSorts = sortConfigs.map(s => s.key === key ? { ...s, direction: 'asc' as const } : s);
        } else {
          newSorts = sortConfigs.filter(s => s.key !== key);
        }
      } else {
        newSorts = [...sortConfigs, { key, direction: 'desc' }];
      }
    } else {
      if (existing) {
        if (existing.direction === 'desc') {
          newSorts = [{ key, direction: 'asc' }];
        } else {
          newSorts = [];
        }
      } else {
        newSorts = [{ key, direction: 'desc' }];
      }
    }

    if (newSorts.length === 0) {
        newSorts = [{ key: 'timestamp', direction: 'desc' }];
    }

    setSortConfigs(newSorts);
    fetchData(1, newSorts);
  };

  // ─── Status Update Handler ────────────────────────────────────────────
  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        // Update local state for immediate feedback
        if (data) {
          const newAlerts = data.alerts.map(a => 
            a._id === alertId ? { ...a, status: newStatus } : a
          );
          setData({ ...data, alerts: newAlerts });
          
          if (selectedAlert && selectedAlert._id === alertId) {
            setSelectedAlert({ ...selectedAlert, status: newStatus });
          }
        }
        // Fetch fresh data in background to update metrics
        fetchData(page, sortConfigs);
        setStatusMessage({ text: 'Status updated successfully', type: 'success' });
      } else {
        setStatusMessage({ text: json.error || 'Failed to update status', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error updating status', type: 'error' });
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12 text-indigo-500" />
          <h2 className="text-xl font-semibold text-neutral-400">Loading SIEM Data...</h2>
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-red-500 p-6 bg-red-500/10 rounded-xl border border-red-500/20 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load data</h2>
          <p className="text-sm mt-2 text-red-400">{data?.error || 'Ensure MongoDB is running and MONGO_URI is set.'}</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Sample Data'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-neutral-800 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-bold tracking-tight text-white">SIEM Dashboard</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                id="generate-logs-btn"
                onClick={handleGenerate}
                disabled={generating || uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {generating ? 'Generating...' : 'Generate Logs'}
              </button>

              <div className="relative group/upload">
                <label
                  id="upload-logs-btn"
                  className={`flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-xl text-neutral-200 text-sm font-semibold transition-all cursor-pointer border border-neutral-700 hover:border-neutral-600 ${(uploading || generating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload Logs'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleUpload}
                    disabled={uploading || generating}
                    className="hidden"
                  />
                </label>
                
                {/* Info Tooltip Icon */}
                <div className="absolute -top-1 -right-1 group/tooltip">
                  <div className="p-1 bg-neutral-900 border border-neutral-700 rounded-full text-indigo-400 shadow-lg cursor-help hover:text-indigo-300 transition-colors">
                    <Info className="w-3 h-3" />
                  </div>
                  
                  {/* Tooltip Content */}
                  <div className="absolute top-8 right-0 w-64 p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 translate-y-2 group-hover/tooltip:translate-y-0">
                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Log Upload Format</h4>
                    <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
                      Upload a <code className="text-indigo-400">.json</code> file with an array of objects. Required field: <code className="text-indigo-400">"action"</code>.
                    </p>
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tighter">Triggers:</p>
                      <ul className="text-[10px] space-y-1 text-neutral-300">
                        <li><span className="text-red-400 font-mono">"high_value_transfer"</span> → Critical</li>
                        <li><span className="text-red-400 font-mono">"role_change"</span> → Critical</li>
                        <li><span className="text-orange-400 font-mono">"login_failed"</span> → High</li>
                        <li><span className="text-blue-400 font-mono">"login_success"</span> → Low</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-800 text-[10px] text-neutral-500 italic">
                      Check root folder for sample_logs.json
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-neutral-400 text-sm font-medium tracking-wide uppercase">
            Real-time threat detection & analysis
          </p>

          {/* Status Toast */}
          {statusMessage && (
            <div className={`mt-2 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {statusMessage.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              {statusMessage.text}
            </div>
          )}
        </header>

        <MetricCards metrics={data.metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SeverityChart metrics={data.metrics} />
          <RiskScoreboard />
        </div>

        <div className="mt-6">
          <MitreHeatmap 
            alerts={data.alerts}
            metrics={data.metrics}
            selectedTechnique={selectedTechnique}
            onFilterChange={(techId) => setSelectedTechnique(techId)}
          />
        </div>

        <div className="mt-6">
          <AlertsTable 
            alerts={data.alerts}
            pagination={data.pagination}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedTechnique={selectedTechnique}
            onClearTechnique={() => setSelectedTechnique(null)}
            sortConfigs={sortConfigs}
            handleSort={handleSort}
            goToPage={goToPage}
            handleGenerate={handleGenerate}
            generating={generating}
            onRowClick={(alert) => setSelectedAlert(alert)}
          />
        </div>

      </div>

      <AlertDetailDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
