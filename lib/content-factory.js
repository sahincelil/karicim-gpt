const MAX_TOPIC_CHARS = 500;
const MAX_BRIEF_CHARS = 1800;

export function normalizeContentFactoryInput(input = {}) {
  const topic = typeof input.topic === 'string' ? input.topic.trim() : '';
  const brief = typeof input.brief === 'string' ? input.brief.trim() : '';

  if (topic.length < 4) {
    throw Object.assign(new Error('En az 4 karakterlik bir konu gir.'), { status: 400 });
  }
  if (topic.length > MAX_TOPIC_CHARS) {
    throw Object.assign(new Error(`Konu en fazla ${MAX_TOPIC_CHARS} karakter olabilir.`), { status: 400 });
  }
  if (brief.length > MAX_BRIEF_CHARS) {
    throw Object.assign(new Error(`Ek notlar en fazla ${MAX_BRIEF_CHARS} karakter olabilir.`), { status: 400 });
  }

  return { topic, brief };
}

export function buildContentFactoryPrompt(input = {}) {
  const { topic, brief } = normalizeContentFactoryInput(input);
  const optionalBrief = brief ? `\n\nKullanıcı notları: ${brief}` : '';

  return `# LEGION CONTENT FACTORY
Kanal: SYSTEM ARCHIVE // HUMAN PROTOCOL
Konu: ${topic}${optionalBrief}

## Editoryal kimlik
- Türkçe, yüz göstermeyen, sinematik mini-belgesel kanalı.
- Ana alanlar: insan davranışı, beyin ve algı, psikoloji, teknoloji ve görünmeyen sistemler.
- Merak uyandır, fakat sansasyon uğruna gerçeği eğip bükme.
- İzleyiciyi küçümseme; doğal, akıcı ve seslendirmeye uygun Türkçe kullan.

## Araştırma ve doğruluk
- Güncel veya bilimsel iddiaları mümkün olduğunda birincil kaynaklar, hakemli çalışmalar, resmi kurumlar ve güvenilir yayınlarla doğrula.
- Kaynak başlığı, kurum/yazar, tarih ve doğrudan URL ver. Erişemediğin veya doğrulayamadığın kaynağı uydurma.
- Korelasyonu nedensellik gibi sunma. Bilimsel uzlaşı yoksa bunu açıkça belirt.
- Bilgi ile yorum/yaratıcı anlatımı birbirinden ayır; belirsiz noktaları “doğrulama gerekli” diye işaretle.
- Telifli metinleri, senaryoları veya videoları kopyalama. Özgün anlatım, lisanslı ya da kamu malı görseller öner.

## A. Editoryal araştırma
1. Konunun izleyici için neden ilginç olduğunu tek paragrafta açıkla.
2. Üç farklı anlatı açısı ve her biri için izleyici vaadi öner.
3. Benzer içeriklerde aranacak rakip/arama terimlerini ver; doğrulanmış rakip verisi yoksa rakip performansı uydurma.
4. En güçlü açıyı seç ve seçme gerekçesini yaz.
5. Kaynakları ve doğrulanması gereken iddiaları listele.

## B. YouTube Shorts paketi
- 40-55 saniyelik, tek başına anlaşılır bir seslendirme metni yaz.
- İlk 1-2 saniyede somut ve güçlü bir kanca kullan.
- Üç başlık/kanca varyasyonu sun; her birinin hipotezini açıkla.
- 0-3, 3-10, 10-25, 25-40 ve 40-55 saniyeler için sahne planı, ekrandaki metin, görsel/B-roll ve ses önerisi ver.
- 9:16 kadraj, altyazı ritmi, açıklama, ilgili etiketler ve doğal bir CTA ekle.
- Shorts için bir ölçüm hipotezi belirt: izlenme, etkileşimli görüntüleme, izleyici tutma ve abone dönüşümü.

## C. Uzun video paketi
- 6-8 dakikalık özgün anlatım metni üret; yalnızca başlık/iskelet verme.
- Açılış kancası, bağlam, ana bölümler, örnekler, sonuç ve CTA akışını kur.
- Zaman kodlu bölümler, 16:9 görsel/B-roll planı, ekran yazıları ve ses tasarımı ekle.
- Üç başlık ve iki thumbnail fikri sun.
- Açıklama, bölüm zamanları, sabit yorum ve ilgili etiketleri hazırla.
- Uzun video için ayrı ölçüm hipotezi belirt: gösterim tıklama oranı (YouTube Studio'da doğrula), ortalama görüntüleme süresi/yüzdesi ve abone dönüşümü.

## D. Yayın ve öğrenme paketi
- Shorts ile uzun videoyu birbirine bağlayan çapraz izleme akışı öner.
- Aynı konudan üretilebilecek sonraki üç bölüm fikri ver.
- Yayın öncesi doğruluk, seslendirme, telif/lisans, altyazı, kadraj ve metadata kontrol listesi oluştur.
- İlk 24 saat ve 7 gün için ölçüm planı ver; Shorts ve uzun videoyu kendi format grupları içinde karşılaştır.
- Sonraki üretim kararını ölçüm verisine bağla; tek videodan kesin sonuç çıkarma.

## Çıktı standardı
Türkçe ve yayın ekibinin doğrudan kullanabileceği kadar somut ol. A, B, C ve D başlıklarının hepsini doldur. Her iki formatı da üret. Tam metin ver; boş şablon veya yalnızca genel tavsiye sunma. Kaynakları ve belirsizlikleri en sonda ayrıca göster.`;
}
