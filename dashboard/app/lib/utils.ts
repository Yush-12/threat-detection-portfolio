export function getSeverityBadgeColors(severity: string | undefined): string {
  const s = severity?.toLowerCase();
  switch (s) {
    case 'critical':
      return 'bg-rose-50 dark:bg-red-600/20 text-rose-700 dark:text-red-300 border border-rose-200 dark:border-red-400/30';
    case 'high':
      return 'bg-orange-50 dark:bg-red-500/10 text-orange-700 dark:text-red-400 border border-orange-200 dark:border-red-500/20';
    case 'medium':
      return 'bg-amber-50 dark:bg-yellow-500/10 text-amber-800 dark:text-yellow-400 border border-amber-200 dark:border-yellow-500/20';
    case 'low':
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20';
    default:
      return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20';
  }
}
