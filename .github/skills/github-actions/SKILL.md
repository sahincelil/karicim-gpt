---
name: github-actions
description: Edit GitHub Actions under .github/workflows using hardened defaults. Use when changing triggers, pinning actions, or permissions.
---

# github-actions

Uygulanan kurallar:
- `permissions: {}` workflow; job `contents: read`
- action SHA pin (`actions/checkout@3d3c42e…` = v7.0.1)
- `persist-credentials: false`
- `timeout-minutes: 5`
- `ubuntu-24.04` (latest değil)
- girdi → `env`, `run:` içine `${{ }}` yok
- `pull_request_target` yok
- Dependabot: `.github/dependabot.yml` (github-actions, weekly)

C: yok. Runner xAI değil.
