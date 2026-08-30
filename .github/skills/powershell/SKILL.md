---
name: powershell
description: Write and review PowerShell 7 (pwsh) and Windows PowerShell 5.1 scripts. Use for Windows automation, C: probes, GitHub runner install, scheduled tasks the user can see. Prefer pwsh. Never silently install a Windows service. Never disable antivirus. Never persist without showing the command.
---

# powershell

- `$ErrorActionPreference = 'Stop'`
- UTF8; Türkçe yorum ASCII veya UTF8 BOM
- Parametre: `param()` üstte
- Token/secret `Write-Host` etme
- ExecutionPolicy: kullanıcı `pwsh -File`; script küresel policy değiştirmez
- C: önizlemede yok; script kullanıcı PC'sinde

Dosyalar: `kopru/karicim-kopru.ps1`, `kopru/install-runner.ps1`
