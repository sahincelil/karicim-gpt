# GitHub Actions YAML

Üst düzey anahtarlar:

```yaml
name: string
run-name: string
permissions: {}          # deny-by-default
concurrency:
  group: string
  cancel-in-progress: true
on:                      # tetik
defaults:
  run:
    shell: bash
jobs:
  id:
    uses: ./.github/workflows/reusable-verify.yml
    with:
      task: tree|skills|nabiz
```

`workflow_call` girişleri: `task` (zorunlu), `min`, `konu`.
Checkout pin: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` # v7.0.1

C: yok.
