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
  const now = Date.now();

  // Randomized counts for variety
  const normalCount = faker.number.int({ min: 350, max: 600 });
  const bruteForceBursts = faker.number.int({ min: 3, max: 6 });
  const highValueCount = faker.number.int({ min: 8, max: 20 });
  const roleChangeCount = faker.number.int({ min: 5, max: 15 });

  // ~Normal banking logs distributed over last 7 days
  for (let i = 0; i < normalCount; i++) {
    const randomPastMs = faker.number.int({ min: 0, max: 7 * 24 * 3600 * 1000 });
    logs.push({
      timestamp: new Date(now - randomPastMs).toISOString(),
      user: faker.internet.username(),
      action: faker.helpers.arrayElement(['login_success', 'transfer', 'balance_check', 'logout']),
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
    });
  }

  // ~Multiple Brute Force / Credential Stuffing Bursts on distinct days/hours
  for (let b = 0; b < bruteForceBursts; b++) {
    const burstIp = faker.internet.ipv4();
    const burstCountry = faker.location.country();
    const burstTimeOffset = faker.number.int({ min: 3600 * 1000, max: 6 * 24 * 3600 * 1000 });
    const burstStart = now - burstTimeOffset;
    const burstCount = faker.number.int({ min: 12, max: 25 });

    for (let i = 0; i < burstCount; i++) {
      const t = new Date(burstStart + i * 3000); // 3-second spacing
      logs.push({
        timestamp: t.toISOString(),
        user: faker.internet.username(),
        action: 'login_failed',
        ip_address: burstIp,
        location: burstCountry,
        device: 'desktop',
      });
    }
  }

  // ~Impossible Travel scenarios (2 logins within 30 min in different countries)
  for (let it = 0; it < 4; it++) {
    const itUser = faker.internet.username();
    const itOffset = faker.number.int({ min: 7200 * 1000, max: 5 * 24 * 3600 * 1000 });
    const itTime = now - itOffset;

    logs.push({
      timestamp: new Date(itTime).toISOString(),
      user: itUser,
      action: 'login_success',
      ip_address: faker.internet.ipv4(),
      location: 'United States',
      device: 'mobile',
    });

    logs.push({
      timestamp: new Date(itTime + 15 * 60 * 1000).toISOString(), // 15 mins later
      user: itUser,
      action: 'login_success',
      ip_address: faker.internet.ipv4(),
      location: 'Japan',
      device: 'desktop',
    });
  }

  // ~High-Value Transfers spread over last 7 days
  for (let i = 0; i < highValueCount; i++) {
    const randomPastMs = faker.number.int({ min: 0, max: 6 * 24 * 3600 * 1000 });
    logs.push({
      timestamp: new Date(now - randomPastMs).toISOString(),
      user: faker.internet.username(),
      action: 'high_value_transfer',
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: faker.helpers.arrayElement(['mobile', 'desktop']),
      amount: Math.round(faker.number.float({ min: 75000, max: 750000 }) * 100) / 100,
      destination_account: faker.finance.iban(),
    });
  }

  // ~Privilege Escalation logs spread over last 7 days
  for (let i = 0; i < roleChangeCount; i++) {
    const randomPastMs = faker.number.int({ min: 0, max: 6 * 24 * 3600 * 1000 });
    logs.push({
      timestamp: new Date(now - randomPastMs).toISOString(),
      user: faker.internet.username(),
      action: 'role_change',
      ip_address: faker.internet.ipv4(),
      location: faker.location.country(),
      device: 'desktop',
      old_role: faker.helpers.arrayElement(['viewer', 'analyst']),
      new_role: faker.helpers.arrayElement(['admin', 'superadmin']),
    });
  }

  // Sort logs chronologically
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ─── Rule Evaluation Engine ─────────────────────────────────────────────────
export interface Alert {
  _id?: string;
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

      for (const group of Object.values(groupedLogs)) {
        let windowStartIdx = 0;
        let windowEndIdx = 0;

        while (windowEndIdx < group.length) {
          const startTime = new Date(group[windowStartIdx].timestamp).getTime();
          const endTime = new Date(group[windowEndIdx].timestamp).getTime();

          if (endTime - startTime <= rule.threshold.timeWindowMs) {
            if (rule.title === 'Impossible Travel') {
               const locations = new Set(group.slice(windowStartIdx, windowEndIdx + 1).map(l => l.location));
               if (locations.size >= 2) {
                 createAlert(rule, group[windowEndIdx], alerts, now);
                 windowStartIdx = windowEndIdx + 1;
               }
            } else {
               if (windowEndIdx - windowStartIdx + 1 >= rule.threshold.count) {
                 createAlert(rule, group[windowEndIdx], alerts, now);
                 windowStartIdx = windowEndIdx + 1;
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

export const HIGH_RISK_COUNTRIES = new Set([
  'Russia',
  'China',
  'North Korea',
  'Iran',
  'Nigeria',
  'Syria',
  'Belarus',
  'Cuba'
]);

export function calculateConfidenceScore(log: RawLog, rule: SigmaRule): number {
  let score = 50;

  // 1. Rule Severity Modifier
  switch (rule.level) {
    case 'critical':
      score += 25;
      break;
    case 'high':
      score += 15;
      break;
    case 'medium':
      score += 5;
      break;
    case 'low':
      score += 0;
      break;
  }

  // 2. Time of Day Modifier (Off-hours: 00:00 - 05:00 UTC)
  if (log.timestamp) {
    try {
      const hour = new Date(log.timestamp).getUTCHours();
      if (hour >= 0 && hour <= 5) {
        score += 10;
      }
    } catch {
      // Ignore timestamp parsing issues
    }
  }

  // 3. Geographic Risk Modifier
  if (log.location && HIGH_RISK_COUNTRIES.has(log.location)) {
    score += 15;
  }

  // 4. Action Context
  if (log.action === 'high_value_transfer' || log.action === 'role_change') {
    score += 10;
  } else if (log.action === 'login_failed') {
    score += 5;
  }

  // Bound score between 1 and 99
  return Math.min(99, Math.max(1, score));
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
    timestamp: log.timestamp || now,
    rule_title: rule.title,
    hit_log: log,
    confidence_score: calculateConfidenceScore(log, rule),
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
  mitre_techniques?: Record<string, { name: string; tactic: string; count: number; max_severity: string }>;
}

export const SEVERITY_RANK: Record<string, number> = { 
  CRITICAL: 4, critical: 4, 
  HIGH: 3, high: 3, 
  MEDIUM: 2, medium: 2, 
  LOW: 1, low: 1 
};

export function computeMetrics(alerts: Alert[]): DashboardMetrics {
  const severityCounts: Record<string, number> = {};
  const techniqueCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const mitreTechniques: Record<string, { name: string; tactic: string; count: number; max_severity: string }> = {};

  const severityRank = SEVERITY_RANK;

  for (const alert of alerts) {
    const sev = (alert.severity || 'unknown').toUpperCase();
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;

    const status = alert.status || 'open';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const techId = alert.mitre_enrichment?.technique_id;
    if (techId) {
      techniqueCounts[techId] = (techniqueCounts[techId] || 0) + 1;
      if (!mitreTechniques[techId]) {
        mitreTechniques[techId] = {
          name: alert.mitre_enrichment?.name || techId,
          tactic: alert.mitre_enrichment?.tactic || 'Unknown',
          count: 0,
          max_severity: sev
        };
      } else {
        if ((severityRank[sev] || 0) > (severityRank[mitreTechniques[techId].max_severity] || 0)) {
          mitreTechniques[techId].max_severity = sev;
        }
      }
      mitreTechniques[techId].count += 1;
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
    mitre_techniques: mitreTechniques,
  };
}

// ─── Incident Correlation Engine ──────────────────────────────────────────
export interface Incident {
  _id?: string;
  incident_id: string;
  title: string;
  entity_type: 'user' | 'ip';
  entity_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  alert_count: number;
  tactics: string[];
  techniques: string[];
  created_at: string;
  updated_at: string;
  summary: string;
}

export function correlateIncidents(alerts: Alert[]): Incident[] {
  const incidents: Incident[] = [];
  const entityAlerts: Record<string, { type: 'user' | 'ip'; alerts: Alert[] }> = {};

  for (const alert of alerts) {
    if (alert.hit_log.user) {
      const uKey = `user:${alert.hit_log.user}`;
      if (!entityAlerts[uKey]) entityAlerts[uKey] = { type: 'user', alerts: [] };
      entityAlerts[uKey].alerts.push(alert);
    }
    if (alert.hit_log.ip_address) {
      const ipKey = `ip:${alert.hit_log.ip_address}`;
      if (!entityAlerts[ipKey]) entityAlerts[ipKey] = { type: 'ip', alerts: [] };
      entityAlerts[ipKey].alerts.push(alert);
    }
  }

  let incidentSeq = 1;
  const now = new Date().toISOString();

  for (const [key, { type, alerts: aList }] of Object.entries(entityAlerts)) {
    const entityId = key.replace(/^(user|ip):/, '');
    
    // Correlate if 2+ alerts with varied techniques or high severity
    const tactics = Array.from(new Set(aList.map(a => a.mitre_enrichment?.tactic).filter(Boolean))) as string[];
    const techniques = Array.from(new Set(aList.map(a => a.mitre_enrichment?.technique_id).filter(Boolean))) as string[];
    const maxRank = Math.max(...aList.map(a => SEVERITY_RANK[(a.severity || 'low').toUpperCase()] || 1));
    
    const isCritical = maxRank === 4;
    const isMultiStage = tactics.length >= 2 || aList.length >= 3;

    if ((isCritical && aList.length >= 2) || isMultiStage) {
      let severity: Incident['severity'] = 'medium';
      if (maxRank === 4 || (maxRank === 3 && aList.length >= 4)) severity = 'critical';
      else if (maxRank === 3 || aList.length >= 3) severity = 'high';

      const title = type === 'user' 
        ? `Coordinated Account Takeover / Abuse: ${entityId}`
        : `Multi-Vector Incursion from Host: ${entityId}`;

      incidents.push({
        incident_id: `INC-${String(incidentSeq++).padStart(4, '0')}`,
        title,
        entity_type: type,
        entity_id: entityId,
        severity,
        status: 'open',
        alert_count: aList.length,
        tactics,
        techniques,
        created_at: aList[0]?.timestamp || now,
        updated_at: now,
        summary: `Correlated ${aList.length} security alerts spanning ${tactics.length} MITRE ATT&CK tactics (${tactics.join(', ')}).`,
      });
    }
  }

  return incidents.sort((a, b) => (SEVERITY_RANK[b.severity.toUpperCase()] || 0) - (SEVERITY_RANK[a.severity.toUpperCase()] || 0));
}

// ─── Full Pipeline (used by both generate and upload) ───────────────────────
export async function runPipeline(db: Db, logs: RawLog[], clearExisting: boolean = true) {
  const start = Date.now();

  if (clearExisting) {
    await db.collection('raw_logs').deleteMany({});
    await db.collection('alerts').deleteMany({});
    await db.collection('incidents').deleteMany({});
  }

  // Insert logs
  if (logs.length > 0) {
    await db.collection('raw_logs').insertMany(logs);
  }

  // Evaluate rules
  const alerts = evaluateRules(logs, SIGMA_RULES);

  // Insert alerts
  if (alerts.length > 0) {
    await db.collection('alerts').insertMany(alerts as unknown as Document[]);
  }

  // Correlate Incidents
  const allAlerts = await db.collection('alerts').find({}).toArray() as unknown as Alert[];
  const incidents = correlateIncidents(allAlerts);
  if (incidents.length > 0) {
    await db.collection('incidents').deleteMany({});
    await db.collection('incidents').insertMany(incidents as unknown as Document[]);
  }

  // Compute and store metrics — recompute from ALL alerts in DB
  const metrics = computeMetrics(allAlerts);
  await db.collection('dashboard_metrics').deleteMany({});
  await db.collection('dashboard_metrics').insertOne(metrics);

  const duration = ((Date.now() - start) / 1000).toFixed(1);

  return {
    totalLogs: logs.length,
    totalAlerts: alerts.length,
    totalAlertsInDb: allAlerts.length,
    totalIncidents: incidents.length,
    duration: `${duration}s`,
  };
}
