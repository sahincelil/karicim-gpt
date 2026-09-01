# KaricimGPT

KaricimGPT, tarayıcıdan Grok ile sohbet etmek için hazırlanmış küçük ve güvenlik odaklı bir web uygulamasıdır.

## Mimari

- `index.html` — web arayüzü
- `app.js` — istemci tarafı sohbet ve yerel geçmiş
- `api/chat.js` — sunucu tarafı xAI Responses API proxy'si
- `vercel.json` — güvenlik başlıkları ve CSP
- `.github/workflows/app-check.yml` — JavaScript ve güvenlik kontrolleri
- `.github/workflows/` — CI / skills / nabız doğrulamaları
- `kopru/` — isteğe bağlı Windows runner/köprü araçları

## Güvenlik

xAI API anahtarı artık tarayıcıya gönderilmez ve GitHub kodunda tutulmaz. Sunucu tarafında `XAI_API_KEY` environment variable olarak tanımlanmalıdır. İstemci yalnızca `/api/chat` endpoint'ine istek gönderir.

Sohbet geçmişi yalnızca kullanıcının tarayıcısındaki `localStorage` içinde tutulur; sunucu tarafında kalıcı kullanıcı veritabanı yoktur.

Self-hosted GitHub Actions runner'ı public repository üzerinde kullanmayın. `kopru/install-runner.ps1` yalnızca private repo için tasarlanmıştır.

## Vercel ile çalıştırma

1. Bu repository'yi Vercel'e bağlayın.
2. Project Environment Variables bölümüne `XAI_API_KEY` ekleyin.
3. Production deploy başlatın.
4. Açılan alan adında `/` adresini açın ve bir test mesajı gönderin.

Vercel Functions `api/chat.js` dosyasını otomatik olarak `/api/chat` endpoint'i olarak sunar.

## Yerel test

Node.js ile syntax kontrolü:

```bash
node --check app.js
node --check api/chat.js
```

Yerel çalıştırma için Vercel CLI veya Vercel'in yerel geliştirme sunucusu kullanılabilir.

## Model

Backend varsayılan olarak `grok-4.6` kullanır. xAI API anahtarı yalnızca sunucu ortamında bulunmalıdır.
