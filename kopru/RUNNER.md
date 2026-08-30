# Self-hosted runner kurulumu

**Public repo + self-hosted = hayır.** Bu repo public. Önce özel yap:
https://github.com/sahincelil/karicim-gpt/settings → Change visibility → Private.

Sonra token al:
https://github.com/sahincelil/karicim-gpt/settings/actions/runners/new

Windows x64, runner **v2.337.0**, klasör `C:\actions-runner`.

PowerShell (yönetici gerekmez):

```powershell
irm https://raw.githubusercontent.com/sahincelil/karicim-gpt/main/kopru/install-runner.ps1 -OutFile install-runner.ps1
.\install-runner.ps1 -Token PASTE
C:\actions-runner\run.cmd
```

SHA256 zip: `1150692afa94e71f872017e254ea55b6eece1eece3fe7e3a6d4c93d0a1b85cfc`

Etiketler: `self-hosted`, `Windows`, `karicim` → `kopru.yml` bunlarla eşleşir.

- Servis yok (`run.cmd` görünür kalsın)
- `.credentials` / `.runner` commit etme
- Fork PR bu makinede çalışmasın (repo özel olsun)
