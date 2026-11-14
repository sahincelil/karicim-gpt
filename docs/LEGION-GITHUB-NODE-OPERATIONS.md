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
