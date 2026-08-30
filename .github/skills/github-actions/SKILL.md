---
name: github-actions
description: Configure GitHub Actions YAML (name, on, permissions, concurrency, defaults, jobs.uses workflow_call). Use when editing .github/workflows.
---

# github-actions

Şablon: `.github/workflows/reusable-verify.yml` (`on.workflow_call`).
Çağıranlar: ci.yml, skills.yml, nabiz.yml — `jobs.*.uses` + `with.task`.

YAML sırası: name → run-name → permissions → concurrency → on → defaults → jobs.
C: yok.
