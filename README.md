# Indigo Sapat Primary — web sitesi

Indigo Academy'ye bağlı **Indigo Sapat Primary** ilkokulu (1–6. sınıflar, kız-erkek karma, Rusça ve Kırgızca sınıflar)
için 3 dilli (Kırgızca, Rusça, İngilizce) site ve **3 dilli yönetim paneli** (`/admin/`).

## Yönetim paneli (`/admin/`)
Adres: **https://ademtkn.github.io/indigosapatprimary/admin/**

WordPress/Joomla gibi, kod bilmeden siteyi yönetmek için. Panel arayüzü Kırgızca, Rusça ve İngilizcedir (sağ üstten seçilir).

| Bölüm | Ne yapılır |
|---|---|
| **Sayfa metinleri** | Her sayfanın tüm metinleri, üç dil alt alta. Liste öğeleri (SSS, kartlar, adımlar, takvim…) eklenir, silinir, sıralanır. Metin arama vardır. |
| **Menü** | Menü sırası, gizleme, silme, menü adları, yeni bağlantı ekleme, "Başvuru" düğmesi. |
| **Haberler** | Blog gibi haber yazıları: tarih, fotoğraf, başlık ve metin (3 dil), yayında/gizli. Haberler sayfasında ve ana sayfada (son 3) görünür. |
| **Kadro** | Kişi ekleme/silme/sıralama, fotoğraf, ad ve görev (3 dil), bölüm, "ana dili İngilizce" rozeti. |
| **Görseller** | Sitedeki tüm fotoğraf alanları; yükle/değiştir/kaldır. Fotoğraflar tarayıcıda otomatik küçültülür. |
| **Ayarlar** | Telefonlar, WhatsApp, adres ve çalışma saatleri (3 dil), Instagram, 2GIS, alan adı. |

**Nasıl çalışır:** Sunucu yoktur. Panel, içerikleri bu GitHub deposundaki `content/*.json` dosyalarında tutar.
"Yayınla" düğmesine basınca panel siteyi tarayıcıda yeniden oluşturur (`node src/build.mjs` ile aynı şablonlar:
`src/site.mjs`) ve değişen içerikleri, sayfaları (`docs/`) ve yüklenen fotoğrafları **tek bir commit** olarak depoya
kaydeder. GitHub Pages `main / docs` klasörünü 1–2 dakikada yayınlar; panel son yayının durumunu gösterir.
GitHub Actions gerekmez. Yayınlanmamış değişiklikler tarayıcıda taslak olarak saklanır (sekme kapansa da
kaybolmaz; yüklenen fotoğraflar hariç).

### Editörler (kullanıcı adı + şifre)
Indigo Prime Academy panelindeki gibi çalışır. Panele **kullanıcı adı ve şifre** ile girilir. Şifre **4–6 karakter,
yalnız Latin harf ve rakam** (büyük/küçük harf ayrımı var). Hesaplardaki her değişiklik **"Kaydet ve yayınla"**dan
1–2 dakika sonra geçerli olur.

**İlk kurulum (bir kez):**
1. Panelde giriş ekranının altındaki **"Site sahibi: GitHub erişim anahtarıyla giriş"** bölümünü açıp GitHub token'ınızla girin.
2. Soldaki menüden **Editörler**'e gidin; kendi **Site sahibi** hesabınızı (kullanıcı adı, ad soyad, şifre) oluşturun.
3. **Kaydet ve yayınla**'ya basın. Bundan sonra siz de editörler de kullanıcı adı ve şifreyle girersiniz.

**Editörler bölümünde:**
- **Site sahibi** editör ekler, siler, rolünü ve şifresini değiştirir. **Editör** yalnız kendi şifresini değiştirebilir.
- **Ayrılan editör:** hesabını silmek girişini kapatır; ama panelde çalışırken arka plandaki GitHub token'ını ele
  geçirmiş olabilir. Güvenmiyorsanız: GitHub'da eski token'ı silip yenisini oluşturun → yeni token'la girin →
  **Editörler → Baştan başla** ile tüm hesapları sıfırlayın → kendi hesabınızı ve editörleri yeniden ekleyin.
- **GitHub token'ının süresi dolarsa:** site sahibi kullanıcı adı ve şifresiyle girdiğinde panel yeni token'ı ister;
  yapıştırıp kaydedince tüm hesaplar çalışmaya devam eder (ardından **Kaydet ve yayınla**). Editörlere "site sahibine başvurun" denir.
- 5 hatalı denemeden sonra giriş 30 saniyeden başlayarak artan sürelerle bekletilir.

**Güvenlik notu:** Sunucu olmadığı için GitHub token, `admin/editors.json` içinde her editörün şifresiyle şifreli
olarak (Argon2id + AES-GCM) herkese açık durur. Bu dosyayı ele geçiren biri şifreyi bilgisayarında deneyerek
bulmaya çalışabilir; 6 karakterlik harf+rakam karışık bir şifre için bu çok uzun sürer, ama `123456` gibi sadece rakamdan
oluşan bir şifre dakikalar içinde bulunur. Bu yüzden her editöre farklı, harf ve rakam karışık 6 karakterlik
şifre verin. Token yalnız bu depoya ve yalnız *Contents* iznine sahip olmalı. En kötü durumda biri siteyi
değiştirebilir; GitHub geçmişinden geri alınır ve token iptal edilip yenisi girilir. Daha güçlü koruma
(sunucu tarafında deneme sınırı) istenirse giriş, `server/` klasöründeki Cloudflare Worker'a taşınabilir.

### Site sahibi girişi: GitHub token (bir kere yapılır)
1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   (doğrudan: https://github.com/settings/personal-access-tokens/new).
2. **Repository access:** Only select repositories → `indigosapatprimary`.
3. **Permissions:** *Contents* → Read and write, *Actions* → Read.
4. Token'ı panele yapıştırın. Her editöre ayrı token verilebilir; token iptal edilince erişim biter.
   Depoda yazma yetkisi olmayan biri panelde hiçbir şeyi değiştiremez.

## Yayın ayarı
**Settings → Pages → Deploy from a branch → `main` / `/docs`** (şu anki ayar). Kodda (şablon, CSS) değişiklik
yapan geliştirici `node src/build.mjs` çalıştırıp `docs/` dahil commit eder.

## Yapı
```
content/ky|ru|en.json  Her dilin tüm metinleri            (panel: Sayfa metinleri, Menü adları)
content/site.json      Telefon, WhatsApp, Instagram, harita (panel: Ayarlar)
content/menu.json      Menü sırası / gizli öğeler / ek bağlantılar
content/news.json      Haberler
content/staff.json     Kadro
content/images.json    Fotoğraf alanı → yüklenen dosya (assets/uploads/…)
admin/                 Yönetim paneli (statik; derlemede docs/admin'e kopyalanır)
src/site.mjs           Sayfa şablonları (Node'da ve panelde aynen çalışır; docs/admin/lib'e kopyalanır)
src/build.mjs          content/ → docs/ (Node)
assets/                Tasarım, betikler, logo; assets/uploads/ panelden yüklenen fotoğraflar
server/                Yapay zeka asistanı için Cloudflare Worker (isteğe bağlı)
```
Yerel derleme: `node src/build.mjs` (Node 18+, bağımlılık yok) → `docs/`.

Sayfalar (her dilde ayrı, `/ky/…`, `/ru/…`, `/en/…`): `index`, `about`, `academics`, `programs`
(Singapur metodu, İngilizce, English Maths, Robotik, Satranç, Magic Science), `admissions`, `school-life`,
`staff`, `news`, `contact`. Kök `index.html` dil seçim sayfasıdır.

## Doldurulması gerekenler
Hepsi panelden: adres ve telefon (**Ayarlar**), öğretmen isimleri ve fotoğrafları (**Kadro**), okul fotoğrafları
(**Görseller**). Çalışma saatleri, günlük program, belgeler ve SSS cevapları taslaktır; kontrol edin.

Logo: `assets/img/logo.png` (renkli), `blob.png` (logonun beyaz silüeti; süsleme ve lacivert zemin üstündeki beyaz çerçeve için),
`favicon.png`. Renkler logodan alındı: lacivert `#432F91`, turuncu `#FAB25D`, mercan `#EF505F`, mavi `#4371B6`.

## Yapay zeka asistanı
Bilgi tabanı her derlemede metinlerden (haberler ve kadro dahil) yeniden oluşturulur. Gerçek yapay zeka için
`server/` klasöründeki Worker'ı yayınlayıp panelde **Ayarlar → Asistan sunucusu** alanını doldurun.
