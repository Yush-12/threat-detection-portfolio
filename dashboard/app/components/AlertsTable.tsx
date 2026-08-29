import { Search, ArrowUp, ArrowDown, ArrowUpDown, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalAlerts: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AlertsTableProps {
  alerts: any[];
  pagination: Pagination | null;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
  sortConfigs,
  handleSort,
  goToPage,
  handleGenerate,
  generating,
  onRowClick
}: AlertsTableProps) {
  const getSortedAlerts = () => {
    if (!alerts) return [];

    let filtered = [...alerts];
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((alert: any) =>
        alert.rule_title?.toLowerCase().includes(lowSearch) ||
        alert.hit_log?.user?.toLowerCase().includes(lowSearch) ||
        alert.hit_log?.ip_address?.toLowerCase().includes(lowSearch) ||
        alert.mitre_enrichment?.technique_id?.toLowerCase().includes(lowSearch)
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
        } else if (config.key === 'status') {
          const statusScores: Record<string, number> = { 'open': 4, 'investigating': 3, 'resolved': 2, 'false_positive': 1 };
          const aScore = statusScores[a.status?.toLowerCase()] || 0;
          const bScore = statusScores[b.status?.toLowerCase()] || 0;
          comparison = config.direction === 'asc' ? aScore - bScore : bScore - aScore;
        } else if (config.key === 'confidence_score') {
          comparison = config.direction === 'asc' ? a.confidence_score - b.confidence_score : b.confidence_score - a.confidence_score;
        }
        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  };

  const sortedAlerts = getSortedAlerts();

  const getSortIcon = (key: string) => {
    const config = sortConfigs.find(s => s.key === key);
    if (!config) return <ArrowUpDown className="w-3 h-3 ml-1 text-neutral-600 inline opacity-40 group-hover:opacity-100 transition-opacity" />;
    return config.direction === 'asc' ?
      <ArrowUp className="w-3 h-3 ml-1 text-indigo-400 inline" /> :
      <ArrowDown className="w-3 h-3 ml-1 text-indigo-400 inline" />;
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
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-700">
                      {alert.mitre_enrichment.technique_id}
                    </span>
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
