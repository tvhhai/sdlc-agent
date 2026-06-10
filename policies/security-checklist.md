# Security Checklist

Check every changed file against the items below. Flag any hit as **Critical**.

## Input Validation
- [ ] All user-supplied values are validated before use (type, range, format)
- [ ] SQL queries use parameterized statements — no string interpolation
- [ ] File paths are sanitized (no `..` traversal)

## Authentication & Authorization
- [ ] New endpoints verify authentication
- [ ] Authorization checks are present before data access
- [ ] Sensitive operations require re-authentication or CSRF token

## Secrets
- [ ] No secrets, API keys, or credentials in code or config files committed
- [ ] New environment variables are documented in `.env.example`

## Dependency Changes
- [ ] Any new `npm install` / `pip install` changes are reviewed for known CVEs
- [ ] `package-lock.json` / `pnpm-lock.yaml` updated deterministically

## Logging
- [ ] No PII (email, phone, SSN) logged at INFO level or above in production paths
