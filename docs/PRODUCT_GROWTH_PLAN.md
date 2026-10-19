# KaricimGPT — AI Gelir Motoru
**Durum:** Talep doğrulama aşaması  
**Başlangıç:** 19 Ekim 2026  
**Hedef:** 90 gün içinde gerçek bir müşteri ihtiyacını doğrulamak, güvenli bir MVP geliştirmek ve hukuki uygunluk onayından sonra gelir modelini test etmek.

## Ürün hipotezi
Türkçe küçük işletmeler için müşteri tarafından sağlanan genel işletme metinlerinden:
- sık sorulan sorulara yanıt taslakları,
- teklif ve takip mesajı taslakları,
- sosyal medya içerik taslakları
üreten bir AI yardımcı.

Ürün yalnızca taslak üretir; müşteri adına otomatik gönderim, hukuki/finansal tavsiye veya hassas veri işleme ilk sürüme dahil değildir.

## Kimin için?
İlk keşif grubu: yerel hizmet işletmeleri ve küçük ajanslar. Görüşmelerle bir alt segment seçilecek; bu seçim henüz doğrulanmış değildir.

## Değer önerisi
“Tekrarlayan müşteri iletişimi ve içerik hazırlığını daha hızlı tamamlamanıza yardımcı olan, Türkçe çalışan bir AI asistanı.”

## 7 günlük deney
1. Üç sentetik demo oluştur: FAQ yanıtları, teklif taslağı, sosyal medya içerik paketi.
2. 10 potansiyel müşteriyle sorun keşfi için temas kur.
3. En az 3 kişiye demo göster ve geri bildirim iste.
4. İki ciddi pilot ilgisi hedefle; bunu gelir olarak sayma.
5. Hiçbir müşteri verisini izinsiz AI hizmetlerine yükleme.
6. Ücretli hizmete başlamadan önce 657 sayılı DMK m.28 ve ilgili vergi/işletme yükümlülükleri konusunda yazılı uzman görüşü al.

## Müşteri keşif soruları
- En çok tekrarladığınız müşteri mesajı veya içerik işi hangisi?
- Haftada yaklaşık kaç kez oluyor ve ne kadar sürüyor?
- Bugün nasıl çözüyorsunuz; en can sıkıcı tarafı ne?
- Bir taslağın hangi kalite koşullarını sağlaması gerekir?
- Bu işi çözmek için daha önce hangi araçları denediniz?
- Bir demo görseniz hangi durumda düzenli kullanmayı düşünürdünüz?

## 90 günlük aşamalar
### Gün 1–7: Keşif
10 görüşme girişimi, 3 demo, öğrenilenlerin kaydı. Reklam veya ücretli araç satın alma yok.
### Gün 8–30: Doğrulama
En çok tekrar eden tek kullanım senaryosunu seç. 2 nitelikli pilot ilgisi hedefle. İlgi yoksa nişi değiştir.
### Gün 31–60: Güvenli MVP
En dar akışı uygula; test, maliyet sınırı, gizlilik bildirimi, veri silme yaklaşımı ve insan onayı ekle.
### Gün 61–90: Ölçüm
Aktif kullanım, tekrar kullanım, görev başı maliyet, zaman tasarrufu, hata oranı ve ödeme isteğini ölç. Ölçekleme kararını kanıta göre ver.

## Başarı ölçütleri
- Keşif: 10 müşteriyle temas girişimi.
- Demo: 3 değerlendirme.
- Talep: 2 ciddi pilot ilgisi (ödeme veya gelir değildir).
- Ürün: temel akış testlerden geçiyor.
- Ölçekleme: tekrar kullanım ve ödeme isteği hakkında kanıt mevcut.

## Hukuk, güvenlik ve etik kapıları
- Kurucu 657'ye tabi kamu görevlisi olduğundan ticari faaliyete, işletme işletmeye, hizmet sunmaya ve şirket ortaklığı/yönetimine ilişkin sınırlar kurum personel birimi ve mali müşavir/avukatla yazılı olarak teyit edilmelidir.
- Bu teyit alınmadan ücretli hizmet başlatma, ödeme alma veya şirket kurma adımı atılmamalıdır.
- Kamu görevi, kurum cihazları, çalışma zamanı, kurum içi bilgi ve hasta/sağlık verileri kullanılmayacak.
- API anahtarları yalnızca sunucu ortam değişkenlerinde tutulacak; depoya veya istemci tarafına konmayacak.
- İlk sürümde otomatik e-posta/mesaj gönderimi, otomatik deploy, sınırsız araç çalıştırma ve kontrolsüz veri saklama yok.
- Gelir, dönüşüm veya müşteri talebi hakkında doğrulanmamış iddia yayınlanmayacak.

## Landing page taslak metni
### Daha az tekrarlayan iş. Daha hızlı Türkçe içerik.
KaricimGPT, küçük işletmeler için müşteri sorularına yanıt, teklif mesajı ve sosyal medya içerik taslaklarını daha hızlı hazırlamaya yardımcı olan bir AI asistanı fikridir.

**İlk kullanım senaryoları**
- Sık sorulan sorular için yanıt taslakları
- Teklif ve müşteri takip mesajları
- Sosyal medya içerik fikirleri ve taslakları

**Şeffaflık:** Ürün doğrulama aşamasındadır. Henüz doğrulanmış müşteri sayısı, gelir veya performans iddiası yoktur. Hassas ya da gizli müşteri verisi girmeyin.

**İlgi formu alanları (taslak):** İşletme türü, en sık tekrarlanan görev, haftalık tahmini tekrar sayısı, iletişim tercihi (yalnızca uygun hukuki ve gizlilik düzenlemeleri kurulduktan sonra toplanacak).

## Deney günlüğü
Her görüşmeden sonra şu alanları kaydet: tarih, segment, sorun, mevcut çözüm, sıklık, demo tepkisi, itirazlar, sonraki adım. Gereksiz kişisel veri tutma.

## Karar kuralı
Kullanıcılar sorunu net biçimde tarif etmiyor veya demo sonrası tekrar kullanma isteği göstermiyorsa geliştirmeye yatırım artırma; segmenti ya da problemi değiştir.
