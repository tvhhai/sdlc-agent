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
- [ ] Errors returned to clients are generic — no stack traces, SQL, or internals in production responses

## Threat Modeling (for non-trivial features)
- [ ] Trust boundaries mapped (requests, uploads, webhooks, third-party APIs, LLM output)
- [ ] Assets named (credentials, PII, payment data, admin actions, money movement)
- [ ] Abuse cases written next to use cases ("how would I misuse this?")

## AI / LLM Security (any feature that calls an LLM)
- [ ] Model output treated as untrusted — never fed into `eval`/SQL/shell/`innerHTML`/file paths
- [ ] Prompt injection assumed; permissions enforced in code, not in the system prompt
- [ ] Secrets, cross-tenant data, and full system prompts kept out of the context window
- [ ] Tool/agent permissions scoped; destructive or irreversible actions require confirmation
- [ ] Token, rate, and recursion/loop limits set to bound consumption

## OWASP Top 10 — quick cross-check
- [ ] Broken access control — auth + ownership check on every endpoint
- [ ] Injection — parameterized queries, validated input
- [ ] Security misconfiguration — security headers, minimal permissions
- [ ] Vulnerable components — `npm audit`, deps reviewed, lockfile committed (`npm ci`/`pnpm i --frozen-lockfile`)
- [ ] SSRF — server-side URL fetches allowlisted; private/reserved IPs blocked
