# GitHub Actions YAML + Docker

Job host: `ubuntu-24.04` (Docker motoru burada).
Konteyner: `karicim-verify:local` ← `.github/containers/verify`.

```yaml
jobs:
  run:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@…
      - run: docker build -t karicim-verify:local .github/containers/verify
      - run: docker run --rm -v "$PWD:/src:ro" --network none --read-only karicim-verify:local
```

`jobs.container` yok: checkout JS action Node ister.
C: yok.
