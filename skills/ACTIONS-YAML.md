# GitHub Actions YAML + Docker + kopru

Linux verify: `ubuntu-24.04` + Docker `karicim-verify`.
Windows kopru: `windows-2022` + `kopru/karicim-kopru.ps1` (runner C:, ev PC değil).

`kopru.yml` tetik: cron 07–23 TR, workflow_dispatch, repository_dispatch `karicim-kopru`.
Artifact: `kopru-nabiz` (5 gün).

C: önizlemede yok.
