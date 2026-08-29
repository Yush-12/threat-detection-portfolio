"use client";

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Clock } from 'lucide-react';
import type { Alert } from '../lib/siem-engine';

interface TimelineChartProps {
  alerts: Alert[];
}

export function TimelineChart({ alerts }: TimelineChartProps) {
  const chartData = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];

    const buckets: Record<string, { time: string; timestamp: number; critical: number; high: number; medium: number; low: number; total: number }> = {};

    alerts.forEach(alert => {
      const date = new Date(alert.timestamp);
      const bucketKey = `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${String(date.getHours()).padStart(2, '0')}:00`;
      const timeMs = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          time: bucketKey,
          timestamp: timeMs,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
      }

      const sev = (alert.severity || 'low').toLowerCase();
      if (sev === 'critical') buckets[bucketKey].critical += 1;
      else if (sev === 'high') buckets[bucketKey].high += 1;
      else if (sev === 'medium') buckets[bucketKey].medium += 1;
      else buckets[bucketKey].low += 1;
      buckets[bucketKey].total += 1;
    });

    return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
  }, [alerts]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-200">Alert Volume Timeline</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Attack burst distribution over time by severity</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Critical
          </span>
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> High
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Medium
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Low
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-500">
          <Clock className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-mono">No timeline activity available</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#f43f5e" fillOpacity={1} fill="url(#critGrad)" name="Critical" />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fillOpacity={1} fill="url(#highGrad)" name="High" />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fillOpacity={1} fill="url(#medGrad)" name="Medium" />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#lowGrad)" name="Low" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
