# KaricimGPT

Repo: https://github.com/sahincelil/karicim-gpt

## Project cockpit

- [Execution dashboard and verified status](docs/EXECUTION_DASHBOARD.md)
- [Landing page preview (HTML file; not deployed)](docs/landing-page-preview.html)
- [Zero-budget validation kit](docs/ZERO_BUDGET_VALIDATION_KIT.md)
- [First-customer outreach scripts (drafts only)](docs/FIRST_CUSTOMER_OUTREACH.md)
- [Demo examples](docs/DEMO_EXAMPLES.md)
- [90-day product growth plan](docs/PRODUCT_GROWTH_PLAN.md)
- [Architecture notes](docs/ARCHITECTURE.md)
- [Canva editable design](https://www.canva.com/d/5cQoYrVz2r4mFg7)

> Status discipline: CI checks have passed recently, but this alone does not mean a production site is live. Vercel project creation returned 403 Forbidden for the currently connected team; hosting is not yet verified. No customer outreach or revenue is confirmed.

## AI motoru

KaricimGPT artık API anahtarını tarayıcıya koymadan server-side `/api/chat` üzerinden çalışır. Varsayılan sağlayıcı **OpenRouter Free Models Router**'dır. OpenRouter ücretsiz modeller için `openrouter/free` router'ını sunuyor; ücretsiz kullanım rate-limitlidir.

Kurulum için Vercel/server ortamında:

```text
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free
APP_URL=https://site-adresin
```

Anahtar kesinlikle `index.html`, `app.js` veya GitHub dosyalarına yazılmamalıdır.

### Alternatif

`AI_PROVIDER=xai` ve `XAI_API_KEY` ile xAI backend yolu da kullanılabilir.

## Yerel / açık modeller

Tamamen kendi bilgisayarında çalıştırmak istersen OpenRouter yerine yerel Ollama gibi bir gateway eklenebilir. Bu durumda inference maliyeti sağlayıcıya değil kendi donanımına aittir.

## Güvenlik

- API anahtarları server-side environment variable'dır.
- Frontend yalnızca `/api/chat` çağırır.
- Mesaj ve çıktı boyutları sınırlıdır.
- 45 saniye timeout vardır.
- GitHub Actions doğrulaması ayrı tutulur.
- Production'da public self-hosted runner kullanılmamalıdır.

## Kontrollü Evolution

Sistem, `/api/audit`, `/api/proposals` ve `/api/evolve` üzerinden kendini gözlemleyen bir bakım döngüsü sunar. Council bağımsız model çıktılarından kanıt/iddia sinyalleri çıkarabilir ve yapılandırılmış bir sentez oluşturabilir.

Otomasyon sınırları bilerek korunur: keyfi shell çalıştırma, gizli bilgi ifşası, yıkıcı işlemler, sınırsız kaynak yazımı, otomatik deploy ve otomatik rollback kapalıdır. GitHub Actions ise test, health-check ve raporlama görevlerini otomatik çalıştırır.

## Otonom bakım döngüsü

`/api/evolve` yalnızca statik bir politika döndürmez; canlı audit, self-test ve proposal durumunu birleştirerek mevcut bakım durumunu raporlar. `health=ready` tüm otomatik kontrollerin geçtiğini, `health=attention` ise incelenmesi gereken blocker bulunduğunu gösterir. Bu raporlama katmanı kaynak kodunu kendi başına değiştirmez, deploy etmez ve geri alma işlemi yapmaz.

## Bakım merkezi

`GET /api/maintenance` tek bir raporda self-test, runtime audit ve bakım tekliflerini birleştirir. `docs/ARCHITECTURE.md` sistemin katmanlarını ve kontrollü otonomi modelini açıklar.


## MCP Context Creation

Authenticated endpoint for manually creating, automatically deriving, and searching persistent context records:

- `GET /api/context?q=project&limit=10` — search saved context.
- `POST /api/context` with `{"action":"create","text":"...","tags":["project"]}` — save a context explicitly.
- `POST /api/context` with `{"action":"auto","text":"...","source":"chat-summary"}` — derive candidate preferences, decisions, tasks, and remember-notes from supplied text.
- `POST /api/context` with `{"action":"search","query":"project","limit":10}` — search via POST.

All requests require `Authorization: Bearer $BODY_ADMIN_TOKEN`. Set `CONTEXT_FILE` to choose the context JSON file, or use `DATA_DIR` (default: `./data/context.json`). The store is capped at 500 entries, deduplicates exact text, and rejects text matching common credential patterns. Automatic extraction is intentionally heuristic and only processes text explicitly sent to this endpoint; it does not silently read connected MCP tools or conversation history. A client/agent can call this endpoint with context from a permitted MCP result after applying its own access controls.

Run `npm test` to include the context-engine tests.
