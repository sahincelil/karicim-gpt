---
name: github-yazi
description: Write to sahincelil/karicim-gpt using GitHub MCP. Use when creating files, issues, branches, or PRs on this account. Do not claim Windows C: exists.
---

# github-yazi

Agent Skills keşif yolu (GitHub Copilot):
- proje: `.github/skills/<ad>/SKILL.md`
- ad = YAML `name` = dizin adı
- küçük harf, tire
- gövde: talimat

Bu bağda doğrulanan yazma:
- create_repository
- push_files / create_or_update_file
- issue_write
- create_branch
- PR create / update / merge / review

Okuma:
- get_me, get_repository_tree, get_file_contents
- search_code, search_repositories

C: yok.
