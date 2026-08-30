---
name: docker-verify
description: Build and run the Karicim verify container for GitHub Actions. Use when editing .github/containers/verify or the docker run step in reusable-verify.yml.
---

# docker-verify

- İmaj: `.github/containers/verify/Dockerfile`
- Base: `alpine:3.20.3@sha256:1e42bbe…` (index digest)
- Checkout host’ta (Node action konteynerde kırılmasın)
- `docker build` + `docker run --network none --read-only`
- Görev: env `TASK` = tree|skills|nabiz

C: yok. Runner ≠ grok.
