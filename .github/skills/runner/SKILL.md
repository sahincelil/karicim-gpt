---
name: runner
description: Configure GitHub Actions runners for this repo. Default windows-2022. Self-hosted labels self-hosted,Windows,karicim only if the repository is private. Never attach a self-hosted runner to a public repo.
---

# runner

`kopru.yml` `runs-on`: hosted `windows-2022` veya özel repoda `[self-hosted, Windows, karicim]`.
Public + self-hosted = hayır.
