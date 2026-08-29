import { Search, ArrowUp, ArrowDown, ArrowUpDown, ShieldAlert, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { Pagination } from '../page';

interface AlertsTableProps {
  alerts: any[];
  pagination: Pagination | null;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTechnique?: string | null;
  onClearTechnique?: () => void;
  sortConfigs: { key: string; direction: 'asc' | 'desc' }[];
  handleSort: (key: string, isMulti: boolean) => void;
  goToPage: (page: number) => void;
  handleGenerate: () => void;
  generating: boolean;
  onRowClick?: (alert: any) => void;
}

export function AlertsTable({
  alerts,
  pagination,
  loading,
  searchTerm,
  setSearchTerm,
  selectedTechnique,
  onClearTechnique,
  sortConfigs,
  handleSort,
  goToPage,
  handleGenerate,
  generating,
  onRowClick
}: AlertsTableProps) {
  const sortedAlerts = alerts || [];

  const getSortIcon = (key: string) => {
    const configIndex = sortConfigs.findIndex(c => c.key === key);
    if (configIndex === -1) {
      return <ArrowUpDown className="w-3.5 h-3.5 inline ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />;
    }
    const config = sortConfigs[configIndex];
    return (
      <span className="inline-flex items-center ml-1 text-indigo-400">
        {config.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
        {sortConfigs.length > 1 && (
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 rounded px-1 ml-0.5 font-mono">
            {configIndex + 1}
          </span>
        )}
      </span>
    );
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    const pages: (number | '...')[] = [];
    const total = pagination.totalPages;
    const current = pagination.currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl shadow-black/50 overflow-hidden animate-fade-in-up stagger-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-neutral-200">Alerts</h3>
          {pagination && (
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2.5 py-1 rounded-full">
              {pagination.totalAlerts} total
            </span>
          )}
          {selectedTechnique && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
              <span>MITRE: <strong>{selectedTechnique}</strong></span>
              <button 
                onClick={onClearTechnique}
                className="ml-1 hover:text-white transition-colors"
                title="Clear MITRE filter"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            id="search-alerts"
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
              <th 
                className={`px-6 py-4 font-medium rounded-tl-lg cursor-pointer hover:text-white transition-colors select-none group ${loading ? 'opacity-50 cursor-wait' : ''}`} 
                onClick={(e) => handleSort('timestamp', e.shiftKey)}
              >
                Timestamp {getSortIcon('timestamp')}
              </th>
              <th className="px-6 py-4 font-medium">Rule Title</th>
              <th 
                className={`px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors select-none group ${loading ? 'opacity-50 cursor-wait' : ''}`} 
                onClick={(e) => handleSort('severity', e.shiftKey)}
              >
                Severity {getSortIcon('severity')}
              </th>
              <th 
                className={`px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors select-none group ${loading ? 'opacity-50 cursor-wait' : ''}`} 
                onClick={(e) => handleSort('status', e.shiftKey)}
              >
                Status {getSortIcon('status')}
              </th>
              <th 
                className={`px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors select-none group ${loading ? 'opacity-50 cursor-wait' : ''}`} 
                onClick={(e) => handleSort('confidence_score', e.shiftKey)}
              >
                Confidence {getSortIcon('confidence_score')}
              </th>
              <th className="px-6 py-4 font-medium">User/IP</th>
              <th className="px-6 py-4 font-medium rounded-tr-lg">MITRE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {sortedAlerts && sortedAlerts.map((alert: any, idx: number) => (
              <tr 
                key={idx} 
                onClick={() => onRowClick?.(alert)}
                className={`hover:bg-neutral-800/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                <td className="px-6 py-4 text-neutral-400 font-mono text-xs">
                  {new Date(alert.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium text-neutral-200">
                  {alert.rule_title}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider
                    ${alert.severity?.toLowerCase() === 'critical' ? 'bg-red-600/20 text-red-300 border border-red-400/30 animate-pulse' : ''}
                    ${alert.severity?.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                    ${alert.severity?.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : ''}
                    ${alert.severity?.toLowerCase() === 'low' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                  `}>
                    {alert.severity?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border
                    ${alert.status === 'open' ? 'bg-neutral-800 text-orange-400 border-neutral-700' : ''}
                    ${alert.status === 'investigating' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' : ''}
                    ${alert.status === 'resolved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : ''}
                    ${alert.status === 'false_positive' ? 'bg-neutral-900 text-neutral-500 border-neutral-800' : ''}
                  `}>
                    {alert.status?.replace('_', ' ') || 'OPEN'}
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
                    <a
                      href={`https://attack.mitre.org/techniques/${alert.mitre_enrichment.technique_id.replace('.', '/')}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800/80 hover:bg-indigo-950/60 text-neutral-300 hover:text-indigo-300 rounded-lg text-xs font-mono border border-neutral-700 hover:border-indigo-500/40 transition-all group"
                      title={`Open ${alert.mitre_enrichment.technique_id} on official MITRE ATT&CK website`}
                    >
                      <span>{alert.mitre_enrichment.technique_id}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                    </a>
                  ) : (
                    <span className="text-neutral-600">-</span>
                  )}
                </td>
              </tr>
            ))}
            {(!sortedAlerts || sortedAlerts.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-neutral-700" />
                    <p>No alerts found</p>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      Generate sample data →
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1}–{Math.min(pagination.currentPage * pagination.limit, pagination.totalAlerts)} of {pagination.totalAlerts} alerts
          </p>

          <div className="flex items-center gap-1">
            <button
              id="pagination-prev"
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-neutral-600 text-sm">...</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum as number)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    pageNum === pagination.currentPage
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              )
            ))}

            <button
              id="pagination-next"
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || loading}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
