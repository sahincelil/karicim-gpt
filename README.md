# KaricimGPT

Repo: https://github.com/sahincelil/karicim-gpt

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
