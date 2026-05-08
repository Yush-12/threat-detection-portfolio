"use client";

import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, ShieldCheck, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortConfigs, setSortConfigs] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/metrics')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
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
        <div className="text-red-500 p-6 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load data</h2>
          <p className="text-sm mt-2 text-red-400">{data?.error || 'Ensure MongoDB is running and MONGO_URI is set.'}</p>
        </div>
      </div>
    );
  }

  const { metrics, alerts } = data;

  // Format data for Recharts
  const severityColors: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
    UNKNOWN: '#6b7280'
  };

  const severityData = metrics?.alert_counts_by_severity 
    ? Object.entries(metrics.alert_counts_by_severity).map(([key, value]) => ({
        name: String(key),
        value: Number(value),
        fill: severityColors[key] || severityColors.UNKNOWN
      }))
    : [];

  const mitreData = metrics?.top_mitre_techniques
    ? Object.entries(metrics.top_mitre_techniques).map(([key, value]) => ({
        technique: String(key),
        count: Number(value)
      }))
    : [];

  const handleSort = (key: string, isMulti: boolean) => {
    setSortConfigs(prev => {
      const existing = prev.find(s => s.key === key);
      
      if (!isMulti) {
        // Single column sort logic
        if (existing) {
          if (existing.direction === 'asc') return [{ key, direction: 'desc' }];
          return []; // Reset to default
        }
        return [{ key, direction: 'asc' }];
      } else {
        // Multi-column sort (Shift+Click) logic
        if (existing) {
          if (existing.direction === 'asc') {
            return prev.map(s => s.key === key ? { ...s, direction: 'desc' as const } : s);
          }
          return prev.filter(s => s.key !== key);
        }
        return [...prev, { key, direction: 'asc' as const }];
      }
    });
  };

  const getSortedAlerts = () => {
    if (!alerts) return [];
    
    // First, filter by search term
    let filtered = [...alerts];
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((alert: any) => 
        alert.rule_title?.toLowerCase().includes(lowSearch) ||
        alert.hit_log?.user?.toLowerCase().includes(lowSearch) ||
        alert.hit_log?.ip_address?.toLowerCase().includes(lowSearch)
      );
    }

    if (sortConfigs.length === 0) return filtered;

    return filtered.sort((a: any, b: any) => {
      for (const config of sortConfigs) {
        let comparison = 0;
        if (config.key === 'timestamp') {
          const aTime = new Date(a.timestamp).getTime();
          const bTime = new Date(b.timestamp).getTime();
          comparison = config.direction === 'asc' ? aTime - bTime : bTime - aTime;
        } else if (config.key === 'severity') {
          const severityScores: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const aScore = severityScores[a.severity?.toLowerCase()] || 0;
          const bScore = severityScores[b.severity?.toLowerCase()] || 0;
          comparison = config.direction === 'asc' ? aScore - bScore : bScore - aScore;
        } else if (config.key === 'confidence_score') {
          comparison = config.direction === 'asc' ? a.confidence_score - b.confidence_score : b.confidence_score - a.confidence_score;
        }

        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  };

  const sortedAlerts = getSortedAlerts().slice(0, 50);

  const getSortIcon = (key: string) => {
    const config = sortConfigs.find(s => s.key === key);
    if (!config) return <ArrowUpDown className="w-3 h-3 ml-1 text-neutral-600 inline opacity-40 group-hover:opacity-100 transition-opacity" />;
    return config.direction === 'asc' ? 
      <ArrowUp className="w-3 h-3 ml-1 text-indigo-400 inline shadow-glow" /> : 
      <ArrowDown className="w-3 h-3 ml-1 text-indigo-400 inline shadow-glow" />;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-bold tracking-tight text-white">SIEM Dashboard</h1>
          </div>
          <p className="text-neutral-400 text-sm font-medium tracking-wide uppercase">
            Data from last SIEM engine run
          </p>
        </header>

        {/* Top Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Alerts</p>
                <p className="text-3xl font-bold text-white">{metrics?.total_alerts || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 hover:border-red-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-400">High/Critical Alerts</p>
                <p className="text-3xl font-bold text-white">
                  {(metrics?.alert_counts_by_severity?.HIGH || 0) + (metrics?.alert_counts_by_severity?.CRITICAL || 0)}
                </p>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Chart */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50">
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

          {/* MITRE Top Techniques */}
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
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl shadow-black/50 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-200">Most Recent Alerts</h3>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search User, IP, or Rule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all w-full md:w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs uppercase bg-neutral-950/50 text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-medium rounded-tl-lg cursor-pointer hover:text-white transition-colors select-none group" onClick={(e) => handleSort('timestamp', e.shiftKey)}>
                    Timestamp {getSortIcon('timestamp')}
                  </th>
                  <th className="px-6 py-4 font-medium">Rule Title</th>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors select-none group" onClick={(e) => handleSort('severity', e.shiftKey)}>
                    Severity {getSortIcon('severity')}
                  </th>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors select-none group" onClick={(e) => handleSort('confidence_score', e.shiftKey)}>
                    Confidence {getSortIcon('confidence_score')}
                  </th>
                  <th className="px-6 py-4 font-medium">User/IP</th>
                  <th className="px-6 py-4 font-medium rounded-tr-lg">MITRE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {sortedAlerts && sortedAlerts.map((alert: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="px-6 py-4 text-neutral-400 font-mono text-xs">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-200">
                      {alert.rule_title}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider
                        ${alert.severity === 'critical' ? 'bg-red-600/20 text-red-300 border border-red-400/30 animate-pulse' : ''}
                        ${alert.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                        ${alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : ''}
                        ${alert.severity === 'low' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                      `}>
                        {alert.severity?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${alert.confidence_score > 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${alert.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-400">{alert.confidence_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {alert.hit_log?.user || '-'} / {alert.hit_log?.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {alert.mitre_enrichment?.technique_id ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-700">
                          {alert.mitre_enrichment.technique_id}
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!sortedAlerts || sortedAlerts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      No alerts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
