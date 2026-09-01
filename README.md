# KaricimGPT

Repo: https://github.com/sahincelil/karicim-gpt

## AI motoru

KaricimGPT artık API anahtarını tarayıcıya koymadan server-side `/api/chat` üzerinden çalışır. Varsayılan sağlayıcı **OpenRouter Free Models Router**'dır. OpenRouter şu anda ücretsiz modeller için `openrouter/free` router'ını sunuyor; ücretsiz kullanım rate-limitlidir. citeturn0search3turn0search6

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

Tamamen kendi bilgisayarında çalıştırmak istersen OpenRouter yerine yerel Ollama gibi bir OpenAI-uyumlu gateway eklenebilir. Bu durumda inference maliyeti sağlayıcıya değil kendi donanımına aittir.

## Güvenlik

- API anahtarları server-side environment variable'dır.
- Frontend yalnızca `/api/chat` çağırır.
- Mesaj ve çıktı boyutları sınırlıdır.
- 45 saniye timeout vardır.
- GitHub Actions doğrulaması ayrı tutulur.
- Production'da public self-hosted runner kullanılmamalıdır.
