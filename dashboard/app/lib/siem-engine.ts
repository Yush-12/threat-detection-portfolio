import { faker } from '@faker-js/faker';
import { Db } from 'mongodb';

// ─── Sigma-Style Rule Definitions ───────────────────────────────────────────
export interface SigmaRule {
  title: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  detection: { action: string; timeRange?: { startHourUTC: number, endHourUTC: number } };
  tags: string[];
  threshold?: {
    field: keyof RawLog; // e.g. 'ip_address', 'user'
    count: number;
    timeWindowMs: number;
  };
}

export const SIGMA_RULES: SigmaRule[] = [
  {
    title: 'Credential Stuffing',
    level: 'high',
    detection: { action: 'login_failed' },
    tags: ['attack.t1110.004'],
    threshold: { field: 'ip_address', count: 5, timeWindowMs: 300000 }, // 5 fails from 1 IP in 5 min
  },
  {
    title: 'Brute Force - Multiple Failed Logins from Single IP',
    level: 'high',
    detection: { action: 'login_failed' },
    tags: ['attack.t1110'],
    threshold: { field: 'ip_address', count: 10, timeWindowMs: 600000 }, // 10 fails from 1 IP in 10 min
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
  {
    title: 'Off-Hours Access',
    level: 'medium',
    detection: { action: 'login_success', timeRange: { startHourUTC: 0, endHourUTC: 5 } },
    tags: ['attack.t1078'],
  },
  {
    title: 'Impossible Travel',
    level: 'high',
    detection: { action: 'login_success' },
    tags: ['attack.t1078'],
    threshold: { field: 'user', count: 2, timeWindowMs: 3600000 }, // 2 successes for same user within 1 hr (simplified placeholder logic)
  }
];

// ─── Static MITRE ATT&CK Lookup ────────────────────────────────────────────
// Avoids downloading the 47MB STIX dataset on serverless
const MITRE_LOOKUP: Record<string, { technique_id: string; name: string; tactic: string; description: string; remediation: string }> = {
  'attack.t1110.004': { 
    technique_id: 'T1110.004', 
    name: 'Brute Force: Credential Stuffing',
    tactic: 'Credential Access',
    description: 'Adversaries may use credentials obtained from breach dumps to systematically try and log into accounts.',
    remediation: 'Implement multi-factor authentication (MFA) and rate limiting on login endpoints.'
  },
  'attack.t1110': { 
    technique_id: 'T1110', 
    name: 'Brute Force',
    tactic: 'Credential Access',
    description: 'Adversaries may use brute force techniques to guess passwords and gain access to accounts.',
    remediation: 'Implement account lockout policies after a certain number of failed login attempts.'
  },
  'attack.t1078': { 
    technique_id: 'T1078', 
    name: 'Valid Accounts',
    tactic: 'Initial Access',
    description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access.',
    remediation: 'Regularly audit active accounts and remove unused or stale accounts.'
  },
  'attack.t1657': { 
    technique_id: 'T1657', 
    name: 'Financial Theft',
    tactic: 'Impact',
    description: 'Adversaries may steal financial assets or conduct fraudulent transactions.',
    remediation: 'Require secondary approval for high-value transfers and implement anomaly detection for financial transactions.'
  },
  'attack.t1078.004': { 
    technique_id: 'T1078.004', 
    name: 'Valid Accounts: Cloud Accounts',
    tactic: 'Initial Access',
    description: 'Adversaries may compromise cloud accounts to gain access to cloud environments.',
    remediation: 'Enforce strong password policies and MFA for all cloud accounts.'
  },
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

  // Randomized counts for variety
  const normalCount = faker.number.int({ min: 300, max: 600 });
  const bruteForceCount = faker.number.int({ min: 20, max: 60 });
  const successMonitorCount = faker.number.int({ min: 10, max: 40 });
  const highValueCount = faker.number.int({ min: 5, max: 25 });
  const roleChangeCount = faker.number.int({ min: 5, max: 20 });

  // ~Normal banking logs
  for (let i = 0; i < normalCount; i++) {
    logs.push({
      timestamp: faker.date.recent({ days: 30 }).toISOString(),
      user: faker.internet.username(),
      action: faker.helpers.arrayElement(['login_success', 'transfer', 'balance_check', 'logout']),
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
    });
  }

  // ~Credential Stuffing / Brute Force
  const badIp = faker.internet.ipv4();
  const baseTime = faker.date.recent({ days: 30 });
  for (let i = 0; i < bruteForceCount; i++) {
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

  // ~Login success monitoring
  const victimUser = faker.internet.username();
  for (let i = 0; i < successMonitorCount; i++) {
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

  // ~High-Value Transfer logs
  for (let i = 0; i < highValueCount; i++) {
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

  // ~Privilege Escalation logs
  for (let i = 0; i < roleChangeCount; i++) {
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
  mitre_enrichment: { technique_id?: string; name?: string; tactic?: string; description?: string; remediation?: string };
  severity: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

export function evaluateRules(logs: RawLog[], rules: SigmaRule[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // Sort logs chronologically for accurate threshold evaluation
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const rule of rules) {
    let matchingLogs = sortedLogs.filter(log => log.action === rule.detection.action);

    // Apply time range filter if specified
    if (rule.detection.timeRange) {
      matchingLogs = matchingLogs.filter(log => {
        const hour = new Date(log.timestamp).getUTCHours();
        return hour >= rule.detection.timeRange!.startHourUTC && hour <= rule.detection.timeRange!.endHourUTC;
      });
    }

    if (rule.threshold) {
      // Threshold grouping logic
      const groupedLogs: Record<string, RawLog[]> = {};
      
      for (const log of matchingLogs) {
        const key = String(log[rule.threshold.field]);
        if (!groupedLogs[key]) groupedLogs[key] = [];
        groupedLogs[key].push(log);
      }

      for (const [key, group] of Object.entries(groupedLogs)) {
        let windowStartIdx = 0;
        let windowEndIdx = 0;

        while (windowEndIdx < group.length) {
          const startTime = new Date(group[windowStartIdx].timestamp).getTime();
          const endTime = new Date(group[windowEndIdx].timestamp).getTime();

          if (endTime - startTime <= rule.threshold.timeWindowMs) {
            // Wait, for Impossible Travel, we need location diversity
            if (rule.title === 'Impossible Travel') {
               const locations = new Set(group.slice(windowStartIdx, windowEndIdx + 1).map(l => l.location));
               if (locations.size >= 2) {
                 createAlert(rule, group[windowEndIdx], alerts, now);
                 windowStartIdx = windowEndIdx + 1; // reset window to avoid duplicate alerts
               }
            } else {
               if (windowEndIdx - windowStartIdx + 1 >= rule.threshold.count) {
                 createAlert(rule, group[windowEndIdx], alerts, now);
                 windowStartIdx = windowEndIdx + 1; // reset window
               }
            }
            windowEndIdx++;
          } else {
            windowStartIdx++;
          }
        }
      }

    } else {
      // Single log evaluation
      for (const log of matchingLogs) {
        createAlert(rule, log, alerts, now);
      }
    }
  }

  return alerts;
}

function createAlert(rule: SigmaRule, log: RawLog, alerts: Alert[], now: string) {
  const mitre_enrichment: { technique_id?: string; name?: string; tactic?: string; description?: string; remediation?: string } = {};

  for (const tag of rule.tags) {
    const lookup = MITRE_LOOKUP[tag];
    if (lookup) {
      mitre_enrichment.technique_id = lookup.technique_id;
      mitre_enrichment.name = lookup.name;
      mitre_enrichment.tactic = lookup.tactic;
      mitre_enrichment.description = lookup.description;
      mitre_enrichment.remediation = lookup.remediation;
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
    status: 'open',
  });
}

// ─── Metrics Computation ────────────────────────────────────────────────────
export interface DashboardMetrics {
  timestamp: string;
  total_alerts: number;
  alert_counts_by_severity: Record<string, number>;
  top_mitre_techniques: Record<string, number>;
  alert_counts_by_status: Record<string, number>;
}

export function computeMetrics(alerts: Alert[]): DashboardMetrics {
  const severityCounts: Record<string, number> = {};
  const techniqueCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  for (const alert of alerts) {
    const sev = (alert.severity || 'unknown').toUpperCase();
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;

    const status = alert.status || 'open';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

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
    alert_counts_by_status: statusCounts,
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
