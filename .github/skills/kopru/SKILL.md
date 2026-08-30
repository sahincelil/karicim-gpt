---
name: kopru
description: Windows C: bridge. Preview has no C:. Home PC C: only if the user runs kopru/karicim-kopru.ps1. GitHub Actions kopru.yml runs the same script on windows-2022 (GitHub VM C:, not the user's PC).
---

# kopru

İki C:
- Ev PC: kullanıcı scripti çalıştırır → `%USERPROFILE%\Karicim\nabiz.md`
- Actions: `.github/workflows/kopru.yml` · `windows-2022` · artifact `kopru-nabiz`

Actions ev diski değil. Admin yok. AV yok.
