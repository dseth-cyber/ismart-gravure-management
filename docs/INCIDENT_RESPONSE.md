# Incident Response Plan

Version: 1.0  
Last updated: 2026-06-16  
Owner: Security Team

---

## 1. Incident Classification

| Severity | Label | Examples | Response Time |
|----------|-------|----------|---------------|
| P0 | Critical | Data breach, service outage, RCE | Immediate |
| P1 | High | Auth bypass, SQL injection, privilege escalation | < 1 hour |
| P2 | Medium | XSS, CSRF, information disclosure | < 4 hours |
| P3 | Low | Rate limit bypass, missing header, misconfiguration | < 24 hours |

---

## 2. Response Phases

### Phase 1: Detection & Triage (Target: < 30 min)

**Signals:**
- Grafana alert notification
- Prometheus Alertmanager
- ModSecurity WAF alert spike
- Failed login rate anomaly
- Unexpected audit log pattern
- User report via [security@ismart-gravure.com](mailto:security@ismart-gravure.com)

**Actions:**
1. Acknowledge the alert
2. Determine severity (P0–P3)
3. For P0/P1: Assemble incident response team
4. Log incident in `#security-incidents` channel

### Phase 2: Containment (Target: < 1 hour for P0/P1)

**Actions:**
1. **Isolate** affected service:
   - WAF: Increase paranoia level to 4 (blocking)
   - Network: Disconnect container from network if needed
   - Rate limit: Tighten per-IP limits
2. **Preserve evidence**:
   - Capture container logs with timestamps
   - Export audit log entries
   - Take Docker container snapshot
3. **Rotate secrets**:
   ```bash
   ./scripts/rotate-secrets.ps1
   docker compose up -d
   ```
4. **Block IOCs** in WAF/Cloudflare

### Phase 3: Eradication (Target: < 4 hours)

**Actions:**
1. Identify root cause from audit logs and WAF alerts
2. Deploy fix (patch, config change, rollback)
3. Run full Trivy scan on all images
4. Run OWASP ZAP scan on affected endpoints
5. Validate fix with security test suite:
   ```bash
   cd backend && npm run test:security
   ```

### Phase 4: Recovery (Target: < 24 hours)

**Actions:**
1. Restore service with fix applied
2. Monitor for 1 hour post-recovery (watch error rates, 4xx/5xx)
3. Confirm audit logs are flowing correctly
4. Re-enable any disabled services

### Phase 5: Post-Mortem (Target: < 72 hours)

**Actions:**
1. Create incident report with timeline
2. Identify root cause and contributing factors
3. Define action items with owners and deadlines
4. Update this plan if gaps found
5. Share findings with team (blameless)

---

## 3. Incident Response Team

| Role | Responsibility | Primary |
|------|---------------|---------|
| Incident Commander | Coordinates response, decisions | On-call SRE |
| Security Lead | Technical investigation | Security Engineer |
| Communications | Internal/external updates | Project Owner |
| Developer | Fix implementation | Backend/Frontend Dev |
| Scribe | Timeline documentation | Rotating role |

---

## 4. Communication Channels

| Channel | Purpose |
|---------|---------|
| `#security-incidents` (internal) | Real-time coordination |
| Email: security@ismart-gravure.com | External vulnerability reports |
| Status page | User-facing status updates |

---

## 5. Post-Incident Checklist

- [ ] Incident report filed
- [ ] Audit logs preserved
- [ ] Secrets rotated (if exposed)
- [ ] WAF rules updated (if applicable)
- [ ] Monitoring rules enhanced
- [ ] Test coverage added for vulnerability
- [ ] Team notified of findings
- [ ] Action items tracked in project board
