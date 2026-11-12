# COMMAND-0 / Distributed Compute Sandbox (Phase 1)

**Status:** Isolated prototype, not a production cluster. No service exposure, persistent remote agent, cryptocurrency miner, auto-deployment or elevated permissions.

## What it does
- Runs two bounded numerical shards with identical Python standard-library code on either a Windows PC or Linux GitHub Actions runners.
- Validates result checksums and checks for missing/overlapping ranges before aggregating.
- GitHub Actions runs only for this folder's pull requests or manual triggers; it does not publish the application.
- Checksum protects against accidental corruption, **not** malicious modification or node impersonation.
- The separate verifier independently recomputes each shard's prime count with a sieve and rejects false counts even when a new valid checksum was attached; duplicate node IDs, gaps, overlaps and malformed data are rejected. This checks bounded *results* but does not authenticate worker identity.

## Local smoke test (Windows, Python 3.10+)
```powershell
python worker.py self-test
python worker.py run --start 0 --stop 10000 --node pc-01 --output result-0.json
python worker.py run --start 10000 --stop 20000 --node pc-02 --output result-1.json
python worker.py verify --start 0 --stop 20000 --files result-0.json result-1.json
```

Expected count: **2262** primes in the interval [0, 20000). Do not overwrite existing outputs; choose a fresh working directory.

## Free cloud execution
The `.github/workflows/command0-compute.yml` CI job uses two **ephemeral**, independent GitHub-hosted runners, uploads small result artifacts and verifies coverage on a third runner. On public repositories, eligible standard GitHub-hosted Actions runners are free under GitHub's current terms. This is not a 24/7 free GPU service.

## Security guardrails
- Offline worker; supports only a hard-coded prime counting task.
- Each shard maximum 50,000 integers and 1,000,000 upper bound.
- No network calls, arbitrary shell commands, environment-secret access, service startup, admin rights or destructive actions.
- PR branch does not change `main`. Merge and production deployment require explicit owner review.

## What is next
Add an authenticated, opt-in queue/coordinator (e.g. Tailscale/WireGuard and scoped credentials), heartbeat reporting, per-node resource caps and cost alarms. Do **not** bridge GitHub Actions directly into PC administrative access or expose a reverse shell.
