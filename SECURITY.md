# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active |

## Reporting a Vulnerability

Report vulnerabilities privately — do NOT file a public GitHub issue.

**Contact:** [security@ismart-gravure.com](mailto:security@ismart-gravure.com)  
**PGP key:** Available on request  
**Response SLA:** 72 hours acknowledgment, 14 days for fix

Include:
- Description of the vulnerability
- Steps to reproduce (PoC preferred)
- Affected version(s)
- Potential impact

## Security Controls

| Control | Status |
|---------|--------|
| TLS 1.3 (Caddy) | ✅ Enforced |
| HSTS preload | ✅ Configured |
| CSP nonce-based | ✅ Implemented |
| WAF (ModSecurity + OWASP CRS) | ✅ Deployed |
| Input validation (Zod) | ✅ All routes |
| XSS sanitization | ✅ Global middleware |
| File upload validation | ✅ MIME + magic bytes |
| Immutable audit logs | ✅ DB trigger |
| Rate limiting | ✅ Token bucket (Redis) |
| RBAC + permission checks | ✅ Granular |
| MFA (TOTP) | ✅ Available |
| Secrets management | ✅ Docker secrets |
| Secrets rotation | ✅ Script available |
| Container scanning (Trivy) | ✅ CI pipeline |
| Dependency scanning | ✅ Dependabot |
| DAST scanning (ZAP) | ✅ Weekly scheduled |
| Network isolation | ✅ Docker networks |
| Read-only containers | ✅ Promtail, cAdvisor |

## Secure Development

- All PRs are reviewed before merge
- `npm audit` runs in CI on every push
- Trivy scans run on every PR
- Secrets never committed to the repository
