# Runner yapılandırması

| Tür | `runs-on` | C: neresi |
|---|---|---|
| Varsayılan | `windows-2022` | GitHub VM |
| Self-hosted | `[self-hosted, Windows, karicim]` | senin PC — **yalnız özel repo** |

Bu repo şu an **public**. Public repoda self-hosted runner PR ile ele geçirilebilir. Takma.

## GitHub-hosted (kayıtlı)

- İmaj: `windows-2022`
- Kabuk: `pwsh`
- Timeout: 10 dk
- Etiket: yok (hosted)

## Self-hosted (repo özel olduktan sonra)

Repo → Settings → Actions → Runners → New self-hosted runner (Windows x64).

```text
.\config.cmd --labels windows,karicim --unattended --name KARICIM-PC
.\run.cmd
```

Servis olarak gizlice kurma. `run.cmd` görünür kalsın.
`.credentials` commit etme.
