---
name: github-actions
description: Edit GitHub Actions triggers and jobs under .github/workflows. Use when customizing on.push, pull_request types, cron, workflow_dispatch inputs, or repository_dispatch.
---

# github-actions

Tetikleyiciler (bu repo):

- ci: `push` main, `pull_request` (opened/synchronize/reopened/ready_for_review), `workflow_dispatch`
- skills: path filter `.github/skills/**` + `skills/**`, aynı PR tipleri, `workflow_dispatch.min`
- nabiz: cron `0 4-20 * * *` (07–23 TR), `workflow_dispatch.konu`, `repository_dispatch` type `karicim-nabiz`

Kurallar:
- cron UTC. TR yaz = UTC+3.
- `concurrency` + cancel-in-progress.
- Runner xAI değil. C: yok.
