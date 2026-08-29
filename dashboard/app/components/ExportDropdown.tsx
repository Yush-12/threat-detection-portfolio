"use client";

import { useState, useEffect, useRef } from 'react';
import { Download, FileText, Table, ChevronDown, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Alert, DashboardMetrics, Incident } from '../lib/siem-engine';

interface ExportDropdownProps {
  alerts: Alert[];
  metrics: DashboardMetrics | null;
  incidents?: Incident[];
}

export function ExportDropdown({ alerts, metrics, incidents = [] }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to fetch full alerts dataset if table is paginated
  const fetchAllAlertsForExport = async (): Promise<Alert[]> => {
    try {
      const res = await fetch('/api/metrics?limit=500&sort=' + encodeURIComponent(JSON.stringify([{ key: 'timestamp', direction: 'desc' }])));
      const json = await res.json();
      if (json && Array.isArray(json.alerts) && json.alerts.length > 0) {
        return json.alerts;
      }
    } catch (e) {
      console.warn('Failed to fetch full export dataset, falling back to local alerts', e);
    }
    return alerts;
  };

  // ─── CSV Direct Export ──────────────────────────────────────────────────
  const exportCSV = async () => {
    setExporting(true);
    try {
      const dataset = await fetchAllAlertsForExport();
      if (!dataset || dataset.length === 0) return;

      const headers = ['Timestamp', 'Rule Title', 'Severity', 'User', 'IP Address', 'Location', 'MITRE ID', 'MITRE Name', 'Status'];
      const rows = dataset.map(a => [
        `"${a.timestamp}"`,
        `"${(a.rule_title || '').replace(/"/g, '""')}"`,
        `"${a.severity || ''}"`,
        `"${a.hit_log?.user || ''}"`,
        `"${a.hit_log?.ip_address || ''}"`,
        `"${a.hit_log?.location || ''}"`,
        `"${a.mitre_enrichment?.technique_id || ''}"`,
        `"${(a.mitre_enrichment?.name || '').replace(/"/g, '""')}"`,
        `"${a.status || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `siem_alerts_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  // ─── PDF Export (Opens in New Tab Preview) ──────────────────────────────
  const exportPDF = async () => {
    setExporting(true);
    try {
      const dataset = await fetchAllAlertsForExport();
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 0, 210, 36, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SOC Threat Intelligence & Incident Report', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toUTCString()} | Threat Detection Portfolio SIEM`, 14, 26);

      // Executive Summary
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Threat Summary', 14, 46);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Alerts Analyzed: ${metrics?.total_alerts || dataset.length}`, 14, 54);
      doc.text(`Critical Severity Alerts: ${metrics?.alert_counts_by_severity?.CRITICAL || 0}`, 14, 60);
      doc.text(`High Severity Alerts: ${metrics?.alert_counts_by_severity?.HIGH || 0}`, 80, 60);
      doc.text(`Correlated Attack Incidents: ${incidents.length}`, 140, 60);

      // Incidents Table (if any)
      let nextY = 70;
      if (incidents.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('2. High-Priority Correlated Incidents', 14, nextY);

        const incRows = incidents.map(inc => [
          inc.incident_id,
          inc.title,
          inc.severity.toUpperCase(),
          `${inc.entity_type.toUpperCase()}: ${inc.entity_id}`,
          `${inc.alert_count} alerts`,
        ]);

        autoTable(doc, {
          startY: nextY + 4,
          head: [['ID', 'Incident Title', 'Severity', 'Target Entity', 'Volume']],
          body: incRows,
          theme: 'striped',
          headStyles: { fillColor: [225, 29, 72] }, // Rose red
          styles: { fontSize: 8 },
        });

        // @ts-expect-error autoTable adds lastAutoTable to doc
        nextY = (doc.lastAutoTable?.finalY || nextY + 40) + 12;
      }

      // Security Alerts Sample Table
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Security Alerts Log', 14, nextY);

      const alertRows = dataset.slice(0, 50).map(a => [
        new Date(a.timestamp).toLocaleString(),
        a.rule_title,
        (a.severity || 'low').toUpperCase(),
        a.hit_log?.user || a.hit_log?.ip_address || 'N/A',
        a.mitre_enrichment?.technique_id || 'N/A',
        (a.status || 'open').toUpperCase(),
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Time', 'Rule Title', 'Severity', 'Entity', 'MITRE ID', 'Status']],
        body: alertRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo
        styles: { fontSize: 8 },
      });

      // Output as Blob and open in new tab
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 active:bg-slate-100 dark:active:bg-neutral-600 rounded-xl text-slate-800 dark:text-neutral-200 text-sm font-semibold transition-all border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 disabled:opacity-50 shadow-xs"
      >
        <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>{exporting ? 'Preparing...' : 'Export Report'}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl dark:shadow-2xl z-50 p-1.5 animate-fade-in"
        >
          <button
            onClick={exportPDF}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Preview Report (PDF)</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300" />
          </button>

          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Download Raw (CSV)</span>
            </div>
            <Download className="w-3 h-3 text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300" />
          </button>
        </div>
      )}
    </div>
  );
}
