# LEGION OSINT GUARD — Self-Audit Specification

## Purpose
Help an account owner understand their own publicly visible digital footprint and reduce impersonation risk.

## MVP workflow
1. User supplies only usernames they own or are explicitly authorized to audit.
2. Maigret may be run manually against those usernames using its documented public-site checks.
3. Findings are treated as candidate matches, not confirmed identity.
4. User reviews each result and records only the platform, public profile URL, match confidence, and remediation status.
5. User removes unnecessary public profile details, strengthens account authentication, and reports impersonation through platform channels.

## Guardrails
- No password collection, credential stuffing, login attempts, private-account access, scraping behind authentication, or access-control bypass.
- No third-party dossiers, sensitive-trait inference, location tracking, or doxxing.
- Do not upload personal data, session cookies, access tokens, or private messages.
- Public username matches can be false positives. Verify manually before taking action.
- Store no raw scan output by default; if a user exports a report, keep it under their control.

## Acceptance criteria
- Explicit ownership/authorization confirmation.
- Input validation and bounded scan scope.
- No secrets or personal data in logs.
- False-positive review state.
- Exportable local report with remediation checklist.
- Tests for input limits and unsafe target rejection.

## Current status
Specification only. No Maigret scan has been run and no accounts have been queried.
