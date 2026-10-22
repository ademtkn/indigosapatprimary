# Indigo Sapat Primary — web sitesi

Indigo Academy'ye bağlı **Indigo Sapat Primary** ilkokulu (1–6. sınıflar, kız-erkek karma, Rusça ve Kırgızca sınıflar)
için 3 dilli (Kırgızca, Rusça, İngilizce) statik site. Asylkech Girls' School sitesiyle aynı altyapıyı kullanır.

## Yapı
```
src/build.mjs          Sayfa şablonları + okul bilgileri (SITE: telefon, WhatsApp, Instagram, harita) + kadro listesi (STAFF)
src/content/ky|ru|en   Her dilin tüm metinleri
assets/css, js, img    Tasarım, betikler, amblem (SVG)
docs/                  Derlenmiş site (GitHub Pages bu klasörü yayınlar)
server/                Yapay zeka asistanı için Cloudflare Worker (isteğe bağlı)
```
Derleme: `node src/build.mjs` (Node 18+, bağımlılık yok).

Sayfalar (her dilde ayrı, `/ky/…`, `/ru/…`, `/en/…`): `index`, `about`, `academics`, `programs`
(Singapur metodu, İngilizce, English Maths, Robotik, Satranç, Magic Science), `admissions`, `school-life`,
`staff`, `news`, `contact`. Kök `index.html` dil seçim sayfasıdır.

## Doldurulması gerekenler (kaynaklara erişilemedi)
- **Adres:** `src/content/*.mjs` → `common.address` ve `common.addressShort` (boşken "2GIS'te konumumuz" bağlantısı gösterilir).
- **Telefon / WhatsApp:** `src/build.mjs` → `SITE.phones`, `SITE.whatsapp`. WhatsApp boşken tüm "Bize yazın" düğmeleri
  ve iletişim formu Instagram Direct'e yönlenir.
- **Kadro:** `STAFF` listesinde her kişinin `name` alanı: `name: 'Айгүл Асанова'` veya `name: { ky: '…', ru: '…', en: '…' }`.
  Ana dili İngilizce olanlar için `native: true`. Görev adları `src/content/*.mjs` → `staff.roles`. Kişi eklemek/çıkarmak
  için listeye satır ekleyip üç dilde `roles` karşılığını yazın.
- Çalışma saatleri, günlük program, belgeler ve SSS cevapları taslaktır; kontrol edin.

## Gerçek fotoğraflar
Dosyayı bu adla koyup tekrar derleyin; yer tutucu otomatik olarak fotoğrafla değişir.

| Dosya | Nerede |
|---|---|
| `assets/img/photos/home-welcome.jpg` | Ana sayfa karşılama |
| `assets/img/photos/stage-1.jpg` … `stage-3.jpg` | 1–2, 3–4, 5–6. sınıflar |
| `assets/img/photos/english-math.jpg`, `robotics.jpg`, `chess.jpg`, `magic-science.jpg` | Programlar |
| `assets/img/photos/english.jpg`, `languages.jpg` | İngilizce bölümleri |
| `assets/img/photos/life-1.jpg` … `life-3.jpg` | Okul hayatı kolajı |
| `assets/img/photos/about-story.jpg`, `director.jpg` | Hakkımızda |
| `assets/img/photos/news-instagram.jpg`, `news-2gis.jpg` | Haberler |
| `assets/img/staff/<id>.jpg` | Kadro portreleri (ör. `director.jpg`, `native1.jpg`) |

Logo: `assets/img/logo.png` (renkli), `blob.png` (logonun beyaz silüeti; süsleme ve lacivert zemin üstündeki beyaz çerçeve için),
`favicon.png`. Renkler logodan alındı: lacivert `#432F91`, turuncu `#FAB25D`, mercan `#EF505F`, mavi `#4371B6`.

## Yapay zeka asistanı
Asylkech sitesindeki ile aynı: bilgi tabanı her derlemede metinlerden yeniden oluşturulur. Gerçek yapay zeka için
`server/` klasöründeki Worker'ı yayınlayıp `SITE.aiEndpoint` alanını doldurun.

## Yayın (GitHub Pages)
1. GitHub'da `indigosapatprimary` adında depo açın, bu klasörü push edin.
2. **Settings → Pages → Deploy from a branch → main / docs**.
3. Adres: `https://ademtkn.github.io/indigosapatprimary/` (farklı ad seçerseniz `SITE.url`'i güncelleyin).
