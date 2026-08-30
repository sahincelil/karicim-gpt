# GitHub Actions makine kaynakları

Kaynak: https://docs.github.com/en/actions/reference/runners/github-hosted-runners

| Etiket | CPU | RAM | SSD | Ne zaman |
|---|---|---|---|---|
| `ubuntu-24.04` public | 4 | 16 GB | 14 GB | ci / skills / nabiz |
| `windows-2022` public | 4 | 16 GB | 14 GB | kopru |
| aynı etiketler **private** | 2 | 8 GB | 14 GB | — |
| Larger runners | 8+ | 32+ GB | daha çok | GitHub Team/Enterprise org; kişisel hesapta yok |

Bu repo public → 4 / 16 / 14.
YAML ile CPU artmaz. `runs-on` etiketi makineyi seçer, kaynak alanı açmaz.

Self-hosted kaynak = senin PC. Public repoda takma.
