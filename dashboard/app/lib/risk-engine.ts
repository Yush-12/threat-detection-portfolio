import { Alert } from './siem-engine';

export interface EntityRisk {
  entity_id: string; // User or IP
  type: 'user' | 'ip';
  score: number;
  alert_count: number;
  critical_count: number;
  high_count: number;
  top_technique: string;
}

export function computeEntityRiskScores(alerts: Alert[]): EntityRisk[] {
  const entityData: Record<string, {
    type: 'user' | 'ip';
    score: number;
    alert_count: number;
    critical_count: number;
    high_count: number;
    techniques: Record<string, number>;
  }> = {};

  const severityWeights: Record<string, number> = {
    critical: 10,
    high: 5,
    medium: 2,
    low: 1,
  };

  const now = new Date().getTime();

  for (const alert of alerts) {
    const user = alert.hit_log?.user;
    const ip = alert.hit_log?.ip_address;

    const processEntity = (id: string, type: 'user' | 'ip') => {
      if (!id || id === 'unknown' || id === '0.0.0.0') return;

      if (!entityData[id]) {
        entityData[id] = { type, score: 0, alert_count: 0, critical_count: 0, high_count: 0, techniques: {} };
      }

      const weight = severityWeights[alert.severity.toLowerCase()] || 1;
      
      // Time decay: alerts older than 7 days count for 50%, older than 30 days count for 10%
      const alertTime = new Date(alert.timestamp).getTime();
      const daysOld = (now - alertTime) / (1000 * 60 * 60 * 24);
      let timeMultiplier = 1.0;
      if (daysOld > 30) timeMultiplier = 0.1;
      else if (daysOld > 7) timeMultiplier = 0.5;

      entityData[id].score += (weight * timeMultiplier);
      entityData[id].alert_count += 1;
      
      if (alert.severity.toLowerCase() === 'critical') entityData[id].critical_count++;
      if (alert.severity.toLowerCase() === 'high') entityData[id].high_count++;

      const tech = alert.mitre_enrichment?.technique_id;
      if (tech) {
        entityData[id].techniques[tech] = (entityData[id].techniques[tech] || 0) + 1;
      }
    };

    if (user) processEntity(user, 'user');
    if (ip) processEntity(ip, 'ip');
  }

  const results: EntityRisk[] = Object.entries(entityData).map(([id, data]) => {
    // Tactic multiplier (more diverse techniques = higher risk multiplier)
    const uniqueTechniques = Object.keys(data.techniques).length;
    const diversityMultiplier = 1 + (uniqueTechniques * 0.1); 

    // Find top technique
    let topTech = 'Unknown';
    let max = 0;
    for (const [tech, count] of Object.entries(data.techniques)) {
      if (count > max) {
        max = count;
        topTech = tech;
      }
    }

    return {
      entity_id: id,
      type: data.type,
      score: Math.round(data.score * diversityMultiplier),
      alert_count: data.alert_count,
      critical_count: data.critical_count,
      high_count: data.high_count,
      top_technique: topTech,
    };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
