"use client";

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Globe, MapPin } from 'lucide-react';
import type { Alert } from '../lib/siem-engine';
import { getCountryCoordinates } from '../lib/country-coordinates';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface TooltipPayload {
  country: string;
  count: number;
  critical: number;
  high: number;
  x: number;
  y: number;
}

interface GeoMapProps {
  alerts: Alert[];
}

export function GeoMap({ alerts }: GeoMapProps) {
  const [tooltipData, setTooltipData] = useState<TooltipPayload | null>(null);

  const locationData = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];

    const locMap: Record<string, { country: string; coordinates: [number, number]; count: number; critical: number; high: number }> = {};

    alerts.forEach(alert => {
      const loc = alert.hit_log?.location;
      if (!loc) return;

      const coords = getCountryCoordinates(loc);

      if (!locMap[loc]) {
        locMap[loc] = {
          country: loc,
          coordinates: coords,
          count: 0,
          critical: 0,
          high: 0,
        };
      }

      locMap[loc].count += 1;
      const sev = (alert.severity || 'low').toLowerCase();
      if (sev === 'critical') locMap[loc].critical += 1;
      if (sev === 'high') locMap[loc].high += 1;
    });

    return Object.values(locMap);
  }, [alerts]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden animate-fade-in-up relative flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-200">Global Threat Origins</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Geographic distribution of detected adversary activity</p>
          </div>
        </div>

        {/* Stable Header Status */}
        <div className="text-xs font-mono px-3 py-1 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 rounded-lg">
          {locationData.length} Countries Identified
        </div>
      </div>

      <div 
        className="h-[280px] w-full relative flex items-center justify-center bg-slate-100/80 dark:bg-neutral-950/50 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800/60"
        onMouseLeave={() => setTooltipData(null)}
      >
        {/* Crystal Clear High-Contrast Tooltip */}
        {tooltipData && (
          <div 
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-4 py-2.5 bg-slate-950 text-white border border-indigo-500/60 text-xs font-mono rounded-xl shadow-2xl backdrop-blur-md transition-opacity flex items-center gap-2.5 whitespace-nowrap"
            style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
          >
            <span className="font-bold text-white tracking-wide text-xs" style={{ color: '#ffffff' }}>
              {tooltipData.country}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-indigo-300 font-semibold">{tooltipData.count} alerts</span>
            {tooltipData.critical > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] shadow-sm">
                {tooltipData.critical} Crit
              </span>
            )}
            {tooltipData.high > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px] shadow-sm">
                {tooltipData.high} High
              </span>
            )}
          </div>
        )}

        <ComposableMap
          projectionConfig={{ scale: 140, center: [10, 10] }}
          width={800}
          height={380}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {({ geographies }: { geographies: any[] }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey || geo.id || Math.random()}
                  geography={geo}
                  fill="#171717"
                  stroke="#262626"
                  strokeWidth={0.5}
                  className="transition-colors duration-150 rsm-geography"
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#212121", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {locationData.map(({ country, coordinates, count, critical, high }) => {
            const isSevere = critical > 0 || high > 0;
            const bubbleColor = critical > 0 ? "#f43f5e" : high > 0 ? "#f97316" : "#6366f1";
            const radius = Math.min(14, Math.max(5, Math.log2(count + 1) * 3));

            const handlePos = (e: React.MouseEvent<SVGCircleElement>) => {
              const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
              if (rect) {
                setTooltipData({
                  country,
                  count,
                  critical,
                  high,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }
            };

            return (
              <Marker key={country} coordinates={coordinates}>
                {isSevere && (
                  <circle
                    r={radius * 1.6}
                    fill={bubbleColor}
                    opacity={0.3}
                    className="animate-ping pointer-events-none"
                  />
                )}
                
                <circle
                  r={radius}
                  fill={bubbleColor}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  opacity={0.9}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={handlePos}
                  onMouseMove={handlePos}
                  onMouseLeave={() => setTooltipData(null)}
                />
              </Marker>
            );
          })}
        </ComposableMap>

        {locationData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-neutral-500 gap-2">
            <MapPin className="w-5 h-5 opacity-40" />
            <span className="text-xs font-mono">No geographic log data available</span>
          </div>
        )}
      </div>
    </div>
  );
}
