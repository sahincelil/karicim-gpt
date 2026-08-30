---
name: github-actions
description: Create or edit GitHub Actions workflow YAML under .github/workflows. Use when the user asks for CI, schedule, or SKILL.md validation.
---

# github-actions

Dosyalar:
- `.github/workflows/ci.yml` — push/PR, ağaç listesi
- `.github/workflows/skills.yml` — SKILL.md YAML `name` + `description`
- `.github/workflows/nabiz.yml` — günlük 20:00 UTC; grok çalıştırmaz

Kurallar:
- `actions/checkout@v4`
- `permissions.contents: read` (yazma gerekmedikçe)
- Runner xAI değil. Secret yoksa olgu uydurma.
- C: yok.
