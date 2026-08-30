---
name: runner
description: Install GitHub Actions self-hosted runner on the user's Windows PC. Refuse to recommend attaching it to a public repo. Version actions/runner v2.337.0. Script kopru/install-runner.ps1 requires a UI registration token.
---

# runner kurulum

1. Repo private
2. Settings → Actions → Runners → New → token
3. `kopru/install-runner.ps1 -Token ...`
4. `C:\actions-runner\run.cmd`

Servis yok. Public + self-hosted yok.
