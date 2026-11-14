# LEGION rollout gate

**Checked:** 2026-11-14  
**Purpose:** Keep the current GitHub control plane intact while preventing an unsafe or unverified rollout to private Windows nodes.

## Verified project state

- The repository contains the GitHub Issue intake and bounded LEGION planner workflow.
- The planner workflow reads Issues with `issues: read`, grants no repository content permissions, and produces a bounded plan plus specialist analysis artifact. Specialist concurrency is capped at three.
- The authenticated bridge and provider routes are present in source. Source presence is not proof of a live endpoint: deployment, server-side secrets, and authenticated smoke tests are still required.
- The connected Vercel team currently exposes zero linked projects and zero deployments. The deployment blocker record documents prior `403 Forbidden` responses when attempting to create a project. Do not repeat the same create attempt until the correct Vercel account/team and project-creation permission are confirmed.
- The currently connected Windows candidate machines report Windows 10 Pro, and no Tailscale client/service was detected. They are not enrolled LEGION nodes.

## Enrollment gates

A Windows machine must pass every gate before it can become a LEGION node:

1. **Supported operating system:** Upgrade to a currently supported, security-patched Windows release. Windows 10 Home/Pro 22H2 reached end of support on 2025-10-14; older releases are also unsupported. Check Microsoft's lifecycle guidance before enrollment: https://learn.microsoft.com/en-us/lifecycle/products/windows-10-home-and-pro
2. **Owner-controlled sign-in:** Install the official Tailscale client and complete interactive sign-in locally as the device owner. Never place reusable auth keys, device keys, login URLs, passwords, or recovery codes in GitHub Issues, commits, artifacts, or chat.
3. **Tailnet approval:** Confirm the device appears in the intended tailnet and is approved by its administrator.
4. **Least-privilege access:** Use Tailscale Grants with explicit source, destination, protocol, and port restrictions. Keep the default-deny posture. Reference: https://tailscale.com/docs/features/access-control/grants
5. **Host firewall:** Keep Windows Firewall enabled. Do not expose the node service to the public internet or bridge an institutional network through the node.
6. **Authenticated node service:** Bind only to the private Tailscale interface or loopback. Require authenticated requests, request signatures, replay protection, rate limits, an allow-listed task schema, and audit correlation IDs.
7. **Safe pilot:** Start with a harmless health check and read-only inventory task. Verify the logs contain no secrets or sensitive payloads before enabling any additional capability.

## Vercel deployment gate

The AI application requires a server-side deployment, not static hosting alone.

- Confirm the intended Vercel account/team owns the target project or grants project-creation/deployment permission to the connected identity.
- Link the existing `sahincelil/karicim-gpt` repository instead of creating a duplicate project.
- Configure `BRIDGE_SHARED_SECRET` and provider API keys only in the hosting provider's encrypted environment-variable store.
- Do not commit secrets, print them in logs, or send provider keys to node machines.
- First deploy a preview, run authenticated health and bridge smoke tests, and review logs. Production promotion remains a separate human-approved step.

## Runner policy

A self-hosted GitHub Actions runner is optional and is not part of the current rollout. If one is later approved:

- Use a dedicated least-privilege account and a repository-scoped runner group.
- Never run untrusted pull-request code on a privileged self-hosted runner.
- Keep deployment credentials out of the runner unless a narrowly scoped, reviewed workflow requires them.
- Prefer GitHub-hosted runners for public or untrusted CI.

## Current decision

**Rollout status: BLOCKED pending prerequisites.**

The GitHub planning layer is present, but private-node enrollment and live hosting are not verified. Do not install or start a network listener on a candidate machine until its OS is supported, the device owner has completed Tailscale sign-in, and the tailnet administrator has approved the required access policy.

This document intentionally omits machine names, internal IP addresses, credentials, and workplace network details.
