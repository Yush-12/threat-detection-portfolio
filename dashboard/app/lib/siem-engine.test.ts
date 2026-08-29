import { describe, it, expect } from 'vitest';
import { generateSyntheticLogs, evaluateRules, computeMetrics, SIGMA_RULES, RawLog } from './siem-engine';

describe('SIEM Engine Core Logic', () => {
  it('should generate valid synthetic logs', () => {
    const logs = generateSyntheticLogs();
    expect(logs.length).toBeGreaterThan(0);
    
    // Check structure of first log
    const log = logs[0];
    expect(log).toHaveProperty('timestamp');
    expect(log).toHaveProperty('user');
    expect(log).toHaveProperty('action');
    expect(log).toHaveProperty('ip_address');
  });

  it('should evaluate simple rules correctly', () => {
    const sampleLog: RawLog = {
      timestamp: new Date().toISOString(),
      user: 'test_user',
      action: 'login_success',
      ip_address: '1.2.3.4',
      location: 'US',
      device: 'desktop'
    };
    
    const alerts = evaluateRules([sampleLog], SIGMA_RULES);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some(a => a.rule_title === 'Successful Login Monitoring')).toBe(true);
    expect(alerts[0].severity).toBe('low');
  });

  it('should evaluate threshold rules (Credential Stuffing)', () => {
    // Generate 5 failed logins from same IP
    const logs: RawLog[] = Array.from({ length: 5 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      user: `user${i}`,
      action: 'login_failed',
      ip_address: '9.9.9.9',
      location: 'US',
      device: 'desktop'
    }));

    const alerts = evaluateRules(logs, SIGMA_RULES);
    // Should trigger Credential Stuffing (5 count) but not Brute Force (requires 10)
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some(a => a.rule_title === 'Credential Stuffing')).toBe(true);
    expect(alerts.some(a => a.rule_title === 'Brute Force - Multiple Failed Logins from Single IP')).toBe(false);
  });

  it('should compute metrics correctly', () => {
    const sampleLog: RawLog = {
      timestamp: new Date().toISOString(),
      user: 'test_user',
      action: 'role_change',
      ip_address: '1.2.3.4',
      location: 'US',
      device: 'desktop'
    };
    
    const alerts = evaluateRules([sampleLog], SIGMA_RULES); // triggers Privilege Escalation (critical)
    const metrics = computeMetrics(alerts);
    
    expect(metrics.total_alerts).toBe(alerts.length);
    expect(metrics.alert_counts_by_severity['CRITICAL']).toBe(1);
    expect(Object.keys(metrics.top_mitre_techniques).length).toBeGreaterThan(0);
  });
});
