# LEGION: GitHub Control Plane and Private Node Operations

## Purpose

GitHub is LEGION's source-of-truth and coordination plane. It stores reviewed code, task definitions, workflow history, and bounded outputs. It is not a permanently running server and GitHub-hosted Actions runners are ephemeral.

## Current operating model

- Submit non-sensitive work as a GitHub Issue using the `[LEGION]` task prefix and the repository's task form.
- The LEGION intake/planner workflows validate the request and can produce a bounded analysis plan.
- Provider-backed planning requires the repository Actions secret `OPENROUTER_API_KEY`. Keep provider credentials in GitHub Actions Secrets or the deployment host's secret store, never in source files, Issues, workflow artifacts, or chat.
- The multi-provider bridge in the separate draft pull request is not live until it is reviewed, merged, deployed to an authorized host, and supplied with server-side credentials.
- Review proposed code changes through pull requests. Do not allow model output to merge itself into the default branch.

## Private Windows nodes

The Windows computers are execution nodes, not GitHub-hosted servers. A GitHub workflow cannot reach a personal PC merely because the PC is listed in this repository.

Required enrollment sequence:

1. Install the official Tailscale client locally on each supported Windows computer.
2. Complete the account sign-in interactively on each computer. Do not place a Tailscale login URL, auth key, device key, or reusable credential in an Issue or commit.
3. Confirm both computers appear in the same tailnet and record their Tailscale IPs from the local Tailscale client.
4. Apply least-privilege Tailscale ACL/grant rules so only the intended LEGION controller can reach the worker's explicitly selected service port.
5. Keep Windows Firewall enabled. Do not expose the worker service to the public internet.
6. Configure the node service to bind only to the Tailscale interface or loopback plus a verified private reverse proxy. Require authenticated requests, request signing, replay protection, rate limits, and an allow-listed task schema.
7. Test health checks and a harmless read-only task before enabling any additional capability.

The older Windows 10 1709 node must be upgraded to a currently supported Windows release before it is enrolled for ongoing work. Do not treat an obsolete OS as a trusted worker.

## Self-hosted GitHub Actions runners

A self-hosted runner is optional and is not installed by this repository. Registering one requires an administrator to download and configure GitHub's runner software on the target computer using a short-lived registration token from GitHub. Complete that step locally while signed in as the device owner.

If a runner is later enrolled:

- Use a dedicated, least-privilege Windows account and a dedicated runner group.
- Restrict it to this repository and selected labels.
- Never run untrusted pull-request code on a privileged self-hosted runner.
- Keep runner groups and workflow permissions restrictive.
- Do not add broad administrator rights, persistent access tokens, or unrestricted shell execution.
- Prefer GitHub-hosted runners for public/untrusted CI and self-hosted runners only for explicitly approved private-node tasks.

## Readiness checklist

- [ ] Both Windows systems are on supported, patched OS versions.
- [ ] Tailscale is installed and owner-authenticated on each node.
- [ ] Both nodes are visible in the same tailnet.
- [ ] Controller-to-worker connectivity is verified over Tailscale.
- [ ] Firewall and tailnet policy allow only the required service port.
- [ ] Node identity and request authentication are verified.
- [ ] Provider keys are configured as repository/deployment secrets.
- [ ] Bridge deployment and smoke tests are complete.
- [ ] Any self-hosted runner is separately registered and isolated.

## Explicit non-goals

This document does not install software on a PC, register a self-hosted runner, create Tailscale credentials, deploy a public endpoint, or authorize remote shell access. Those are separate, owner-controlled enrollment and deployment steps.

## Verified workstation readiness snapshot (2026-11-14)

The following checks were performed on the two owner-connected Windows computers. Hardware and OS details are read-only observations; no BIOS settings, Windows upgrades, firewall policy, or remote-execution permissions were changed.

### DESKTOP-H6KF7OC

- Windows 10 Pro 22H2, build 19045; Intel Core i5-9400F (6 cores), 8 GB RAM, 240 GB SSD.
- TPM was not detected and Secure Boot was reported disabled. Windows 11 readiness is therefore not established; check motherboard firmware settings and the Microsoft PC Health Check before planning an upgrade.
- MinGit 2.56.1 was installed as a portable, per-user tool from the official Git for Windows release. The downloaded archive SHA-256 was verified against the official GitHub release asset digest before extraction.
- Repository checkout: `C:\\LEGION\\karicim-gpt`, branch `main`, commit `a94201bf0de73fe949a391e7da35049fee39acbc`.
- `npm ci` completed; `npm run check` passed all syntax and regression tests. Local `/health`, `/api/body`, and `/api/self-test` checks passed. The smoke-test listener was bound only to `127.0.0.1` and was stopped after testing.
- No provider API key or bridge shared secret was found in Process, User, or Machine environment variables; no local `.env`, `.env.local`, or `.env.production` file exists in the checkout.
- Tailscale is not installed. An installation download was attempted only from Tailscale's official package host; TLS connections to `pkgs.tailscale.com` and `dl.tailscale.com` were reset by the network. No third-party mirror was used and no firewall/security setting was weakened.

### DESKTOP-J07QKBD

- Windows 10 Pro, build 16299 (version 1709); AMD A9-9420 (2 cores), approximately 3.4 GB RAM, 240 GB SSD.
- TPM was detected but not ready; Secure Boot was reported disabled.
- Tailscale is not installed. This machine is not approved as a persistent worker or self-hosted runner.
- Keep this computer read-only until its operating system and hardware suitability are reviewed. Do not place production credentials or a privileged runner on it.

### Readiness decision

- The first computer is suitable for local development and repeatable tests after OS security support is addressed. Windows 10 Home/Pro reached end of support on 2025-10-14; do not treat this build as a hardened, always-on worker without an appropriate supported-OS plan. See [Microsoft Windows 10 release information](https://learn.microsoft.com/windows/release-health/release-information).
- Tailscale's current Windows client requires Windows 10 or later, but client compatibility does not restore Microsoft's OS security updates. See [Tailscale supported Windows versions](https://tailscale.com/docs/reference/troubleshooting/windows/supported-windows-versions).
- Before enabling any private-node connectivity, resolve the official package-host TLS reset, upgrade/replace unsupported OS installations, complete device-owner Tailscale sign-in, and apply narrowly scoped tailnet/firewall rules.
- Provider credentials remain unconfigured on the first PC. Configure them only in an authorized hosting secret manager; never add them to this repository or chat.

