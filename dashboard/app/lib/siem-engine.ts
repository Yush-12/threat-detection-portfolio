import { faker } from '@faker-js/faker';
import { Db } from 'mongodb';

// ─── Sigma-Style Rule Definitions ───────────────────────────────────────────
export interface SigmaRule {
  title: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  detection: { action: string };
  tags: string[];
}

export const SIGMA_RULES: SigmaRule[] = [
  {
    title: 'Credential Stuffing',
    level: 'high',
    detection: { action: 'login_failed' },
    tags: ['attack.t1110.004'],
  },
  {
    title: 'Brute Force - Multiple Failed Logins from Single IP',
    level: 'high',
    detection: { action: 'login_failed' },
    tags: ['attack.t1110'],
  },
  {
    title: 'Successful Login Monitoring',
    level: 'low',
    detection: { action: 'login_success' },
    tags: ['attack.t1078'],
  },
  {
    title: 'Suspicious High-Value Transfer',
    level: 'critical',
    detection: { action: 'high_value_transfer' },
    tags: ['attack.t1657'],
  },
  {
    title: 'Privilege Escalation - Unauthorized Role Change',
    level: 'critical',
    detection: { action: 'role_change' },
    tags: ['attack.t1078.004'],
  },
];

// ─── Static MITRE ATT&CK Lookup ────────────────────────────────────────────
// Avoids downloading the 47MB STIX dataset on serverless
const MITRE_LOOKUP: Record<string, { technique_id: string; name: string }> = {
  'attack.t1110.004': { technique_id: 'T1110', name: 'Brute Force: Credential Stuffing' },
  'attack.t1110':     { technique_id: 'T1110', name: 'Brute Force' },
  'attack.t1078':     { technique_id: 'T1078', name: 'Valid Accounts' },
  'attack.t1657':     { technique_id: 'T1657', name: 'Financial Theft' },
  'attack.t1078.004': { technique_id: 'T1078', name: 'Valid Accounts: Cloud Accounts' },
};

// ─── Log Generation ─────────────────────────────────────────────────────────
export interface RawLog {
  timestamp: string;
  user: string;
  action: string;
  ip_address: string;
  location: string;
  device: string;
  amount?: number;
  destination_account?: string;
  old_role?: string;
  new_role?: string;
}

export function generateSyntheticLogs(): RawLog[] {
  const logs: RawLog[] = [];

  // ~400 normal banking logs
  for (let i = 0; i < 400; i++) {
    logs.push({
      timestamp: faker.date.recent({ days: 30 }).toISOString(),
      user: faker.internet.username(),
      action: faker.helpers.arrayElement(['login_success', 'transfer', 'balance_check', 'logout']),
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
    });
  }

  // ~40 Credential Stuffing / Brute Force (same IP, different users)
  const badIp = faker.internet.ipv4();
  const baseTime = faker.date.recent({ days: 30 });
  for (let i = 0; i < 40; i++) {
    const t = new Date(baseTime.getTime() + i * 2000);
    logs.push({
      timestamp: t.toISOString(),
      user: faker.internet.username(),
      action: 'login_failed',
      ip_address: badIp,
      location: faker.location.country(),
      device: 'desktop',
    });
  }

  // ~30 Login success monitoring
  const victimUser = faker.internet.username();
  for (let i = 0; i < 30; i++) {
    const t = new Date(baseTime.getTime() + i * 600000);
    logs.push({
      timestamp: t.toISOString(),
      user: victimUser,
      action: 'login_success',
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: 'mobile',
    });
  }

  // ~15 High-Value Transfer logs
  for (let i = 0; i < 15; i++) {
    const t = new Date(baseTime.getTime() + i * 10800000);
    logs.push({
      timestamp: t.toISOString(),
      user: faker.internet.username(),
      action: 'high_value_transfer',
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: faker.helpers.arrayElement(['mobile', 'desktop']),
      amount: Math.round(faker.number.float({ min: 50000, max: 500000 }) * 100) / 100,
      destination_account: faker.finance.iban(),
    });
  }

  // ~15 Privilege Escalation logs
  for (let i = 0; i < 15; i++) {
    const t = new Date(baseTime.getTime() + i * 21600000);
    logs.push({
      timestamp: t.toISOString(),
      user: faker.internet.username(),
      action: 'role_change',
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: 'desktop',
      old_role: faker.helpers.arrayElement(['viewer', 'analyst']),
      new_role: faker.helpers.arrayElement(['admin', 'superadmin']),
    });
  }

  return logs;
}

// ─── Rule Evaluation Engine ─────────────────────────────────────────────────
export interface Alert {
  timestamp: string;
  rule_title: string;
  hit_log: RawLog;
  confidence_score: number;
  mitre_enrichment: { technique_id?: string; name?: string };
  severity: string;
}

export function evaluateRules(logs: RawLog[], rules: SigmaRule[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const rule of rules) {
    const matchingLogs = logs.filter(log => log.action === rule.detection.action);

    for (const log of matchingLogs) {
      const mitre_enrichment: { technique_id?: string; name?: string } = {};

      for (const tag of rule.tags) {
        const lookup = MITRE_LOOKUP[tag];
        if (lookup) {
          mitre_enrichment.technique_id = lookup.technique_id;
          mitre_enrichment.name = lookup.name;
          break;
        }
      }

      alerts.push({
        timestamp: now,
        rule_title: rule.title,
        hit_log: log,
        confidence_score: Math.floor(Math.random() * 41) + 60, // 60-100
        mitre_enrichment,
        severity: rule.level,
      });
    }
  }

  return alerts;
}

// ─── Metrics Computation ────────────────────────────────────────────────────
export interface DashboardMetrics {
  timestamp: string;
  total_alerts: number;
  alert_counts_by_severity: Record<string, number>;
  top_mitre_techniques: Record<string, number>;
}

export function computeMetrics(alerts: Alert[]): DashboardMetrics {
  const severityCounts: Record<string, number> = {};
  const techniqueCounts: Record<string, number> = {};

  for (const alert of alerts) {
    const sev = (alert.severity || 'unknown').toUpperCase();
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;

    const techId = alert.mitre_enrichment?.technique_id;
    if (techId) {
      techniqueCounts[techId] = (techniqueCounts[techId] || 0) + 1;
    }
  }

  // Sort techniques by count descending, take top 5
  const sortedTechniques = Object.entries(techniqueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    timestamp: new Date().toISOString(),
    total_alerts: alerts.length,
    alert_counts_by_severity: severityCounts,
    top_mitre_techniques: Object.fromEntries(sortedTechniques),
  };
}

// ─── Full Pipeline (used by both generate and upload) ───────────────────────
export async function runPipeline(db: Db, logs: RawLog[], clearExisting: boolean = true) {
  const start = Date.now();

  if (clearExisting) {
    await db.collection('raw_logs').deleteMany({});
    await db.collection('alerts').deleteMany({});
  }

  // Insert logs
  if (logs.length > 0) {
    await db.collection('raw_logs').insertMany(logs);
  }

  // Evaluate rules
  const alerts = evaluateRules(logs, SIGMA_RULES);

  // Insert alerts
  if (alerts.length > 0) {
    await db.collection('alerts').insertMany(alerts);
  }

  // Compute and store metrics — recompute from ALL alerts in DB
  const allAlerts = await db.collection('alerts').find({}).toArray() as unknown as Alert[];
  const metrics = computeMetrics(allAlerts);
  await db.collection('dashboard_metrics').deleteMany({});
  await db.collection('dashboard_metrics').insertOne(metrics);

  const duration = ((Date.now() - start) / 1000).toFixed(1);

  return {
    totalLogs: logs.length,
    totalAlerts: alerts.length,
    totalAlertsInDb: allAlerts.length,
    duration: `${duration}s`,
  };
}
