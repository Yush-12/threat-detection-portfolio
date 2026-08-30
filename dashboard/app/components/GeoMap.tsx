"use client";

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Globe, MapPin, ShieldAlert, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Alert } from '../lib/siem-engine';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface TooltipPayload {
  country: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  x: number;
  y: number;
  containerWidth: number;
}

interface CountryThreat {
  displayName: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface GeoMapProps {
  alerts: Alert[];
}

function normalizeCountryName(name: string): string {
  if (!name) return '';
  const clean = name.toLowerCase().trim();
  if (clean === 'united states of america' || clean === 'usa' || clean === 'us' || clean === 'united states') return 'united states';
  if (clean.includes('russia')) return 'russia';
  if (clean.includes('korea') && (clean.includes('north') || clean.includes('dprk') || clean.includes('democratic people'))) return 'north korea';
  if (clean.includes('korea') && (clean.includes('south') || clean.includes('republic of korea'))) return 'south korea';
  if (clean.includes('congo') && (clean.includes('dem') || clean.includes('dr'))) return 'democratic republic of the congo';
  if (clean.includes('tanzania')) return 'tanzania';
  if (clean.includes('iran')) return 'iran';
  if (clean.includes('syria')) return 'syria';
  if (clean.includes('lao')) return 'laos';
  if (clean.includes('viet')) return 'vietnam';
  if (clean.includes('samoa')) return 'samoa';
  return clean
    .replace(/^(the|republic of|kingdom of|federation of|state of|islamic republic of)\s+/i, '')
    .replace(/,.*$/, '')
    .trim();
}

export function GeoMap({ alerts }: GeoMapProps) {
  const [tooltipData, setTooltipData] = useState<TooltipPayload | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  const threatMap = useMemo(() => {
    if (!alerts || alerts.length === 0) return new Map<string, CountryThreat>();

    const map = new Map<string, CountryThreat>();

    alerts.forEach(alert => {
      const loc = alert.hit_log?.location;
      if (!loc) return;

      const norm = normalizeCountryName(loc);
      const existing = map.get(norm) || {
        displayName: loc,
        count: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      existing.count += 1;
      const sev = (alert.severity || 'low').toLowerCase();
      if (sev === 'critical') existing.critical += 1;
      else if (sev === 'high') existing.high += 1;
      else if (sev === 'medium') existing.medium += 1;
      else existing.low += 1;

      map.set(norm, existing);
    });

    return map;
  }, [alerts]);

  const activeCountryCount = threatMap.size;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden animate-fade-in-up relative flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-200">Global Threat Choropleth</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Regional adversary density shaded by threat severity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Visual Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono bg-slate-50 dark:bg-neutral-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800">
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-xs"></span> Critical
            </span>
            <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block shadow-xs"></span> High
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block shadow-xs"></span> Active
            </span>
          </div>

          <div className="text-xs font-mono px-3 py-1.5 bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold rounded-xl">
            {activeCountryCount} Active Regions
          </div>
        </div>
      </div>

      <div 
        className="h-[290px] w-full relative flex items-center justify-center bg-slate-50 dark:bg-neutral-950/70 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800/80"
        onMouseLeave={() => setTooltipData(null)}
      >
        {/* Interactive Tooltip with smart boundary clamping */}
        {tooltipData && (() => {
          const w = tooltipData.containerWidth || 600;
          let transform = "-translate-x-1/2 -translate-y-full mb-3";
          let left = tooltipData.x;

          if (tooltipData.x < 160) {
            transform = "translate-x-3 -translate-y-full mb-3";
            left = Math.max(8, tooltipData.x);
          } else if (tooltipData.x > w - 160) {
            transform = "-translate-x-full -translate-y-full -ml-3 mb-3";
            left = Math.min(w - 8, tooltipData.x);
          }

          const top = Math.max(45, tooltipData.y);

          return (
            <div 
              className={`absolute z-30 pointer-events-none transform ${transform} px-4 py-2.5 bg-slate-950/95 text-white border border-slate-700 text-xs font-mono rounded-xl shadow-2xl backdrop-blur-md transition-all duration-75 flex items-center gap-3 whitespace-nowrap`}
              style={{ left: `${left}px`, top: `${top}px` }}
            >
              <div className="flex items-center gap-2">
                {tooltipData.critical > 0 ? (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                ) : (
                  <Shield className="w-4 h-4 text-indigo-400" />
                )}
                <span className="font-bold text-white tracking-wide text-xs">
                  {tooltipData.country}
                </span>
              </div>

              <span className="text-slate-500">•</span>
              <span className="text-slate-200 font-semibold">{tooltipData.count} total alerts</span>

              {tooltipData.critical > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] shadow-sm">
                  {tooltipData.critical} Critical
                </span>
              )}
              {tooltipData.high > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-bold text-[10px] shadow-sm">
                  {tooltipData.high} High
                </span>
              )}
              {tooltipData.critical === 0 && tooltipData.high === 0 && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] shadow-sm">
                  Active
                </span>
              )}
            </div>
          );
        })()}

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
              geographies.map((geo: any) => {
                const rawName = geo.properties.name || geo.properties.NAME || '';
                const normName = normalizeCountryName(rawName);
                const threat = threatMap.get(normName) || threatMap.get(rawName.toLowerCase());

                let fill = isDark ? '#1a1a1a' : '#e2e8f0';
                let stroke = isDark ? '#262626' : '#cbd5e1';
                let hoverFill = isDark ? '#2a2a2a' : '#cbd5e1';

                if (threat) {
                  if (threat.critical > 0) {
                    fill = isDark ? '#be123c' : '#f43f5e'; // rose-700 / rose-500
                    hoverFill = '#e11d48'; // rose-600
                    stroke = isDark ? '#fb7185' : '#fda4af';
                  } else if (threat.high > 0) {
                    fill = isDark ? '#c2410c' : '#f97316'; // orange-700 / orange-500
                    hoverFill = '#ea580c'; // orange-600
                    stroke = isDark ? '#fdba74' : '#fed7aa';
                  } else {
                    fill = isDark ? '#4338ca' : '#6366f1'; // indigo-700 / indigo-500
                    hoverFill = '#4f46e5'; // indigo-600
                    stroke = isDark ? '#a5b4fc' : '#c7d2fe';
                  }
                }

                const handleMouseEnter = (e: React.MouseEvent<SVGPathElement>) => {
                  const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (rect) {
                    setTooltipData({
                      country: threat?.displayName || rawName,
                      count: threat?.count || 0,
                      critical: threat?.critical || 0,
                      high: threat?.high || 0,
                      medium: threat?.medium || 0,
                      low: threat?.low || 0,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      containerWidth: rect.width,
                    });
                  }
                };

                const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
                  const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (rect) {
                    setTooltipData(prev => prev ? ({
                      ...prev,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      containerWidth: rect.width,
                    }) : null);
                  }
                };

                return (
                  <Geography
                    key={geo.rsmKey || geo.id || Math.random()}
                    geography={geo}
                    className="cursor-pointer"
                    onMouseEnter={handleMouseEnter}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setTooltipData(null)}
                    style={{
                      default: { 
                        fill, 
                        stroke, 
                        strokeWidth: threat ? 0.8 : 0.4, 
                        outline: "none",
                        transition: "fill 150ms ease, stroke 150ms ease"
                      },
                      hover: { 
                        fill: hoverFill, 
                        stroke: isDark ? "#ffffff" : "#0f172a", 
                        strokeWidth: 1.2, 
                        outline: "none", 
                        cursor: "pointer" 
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {activeCountryCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-neutral-500 gap-2">
            <MapPin className="w-5 h-5 opacity-40" />
            <span className="text-xs font-mono">No geographic threat log data available</span>
          </div>
        )}
      </div>
    </div>
  );
}
