import { BlogPost } from "./types";

export async function getAllPosts(): Promise<BlogPost[]> {
  return [
    {
      title: "Evde Evcil Hayvan Bakımı: Bilmeniz Gerekenler",
      slug: "evde-evcil-hayvan-bakimi",
      excerpt:
        "Evcil dostunuzun sağlıklı ve mutlu kalması için günlük rutin, doğru beslenme ve güvenli bir çevre şart. Bu rehber temel bakım adımlarını pratik şekilde özetliyor.",
      content: `
# Evde Evcil Hayvan Bakımı: Bilmeniz Gerekenler

Evde bakım; *tutarlı bir rutin*, **doğru beslenme** ve **güvenli ortam** üzerine kurulur. Aşağıdaki adımlar, hem kedi hem köpek sahipleri için uygulanabilir bir plan sunar.

## 1) Günlük Rutin
- **Mama & su**: Su kabını günde en az 1 kez tazeleyin; mamayı paket gramajına göre ölçün.
- **Tuvalet**: Kedide kumu günlük toplayın; köpekte yürüyüş saatlerini sabitleyin.
- **Oyun & ilgi**: 10–15 dakikalık 2–3 kısa oyun seansı obezite ve stresin önüne geçer.
- **Gözlem**: İştah, dışkı/idrarda değişiklik, halsizlik gibi sinyalleri not edin.

> İpucu: Rutin saatleri mümkün olduğunca değişmesin. Öngörülebilirlik = düşük stres.

## 2) Beslenme ve Su
- **Yaşa/türe uygun mama**: Yavru, yetişkin, yaşlı ve ırka özgü formüller farklıdır.
- **Ödül**: Günlük kalorinin **%10**’unu geçmesin.
- **Kap seçimi**: Çelik/seramik tercih edin; plastik kaplarda koku ve bakteri birikimi artar.

## 3) Zihinsel ve Fiziksel Aktivite
- **Kedi**: Tırmalama tahtası, zeka oyuncakları, pencere önü platformlar.
- **Köpek**: Günde 2 yürüyüş + 1 zihin oyunu (lick mat, koklama oyunları).
- **Rotasyon**: Oyuncakları haftalık döndürerek ilgiyi canlı tutun.

## 4) Güvenli Ev Ortamı
- Zehirli bitkileri (zambak, difenbahya vb.) uzaklaştırın.
- Kabloları gizleyin; deterjan/ilaçları kilitli tutun.
- Pencerelere sineklik ve güvenlik kilidi ekleyin.

## 5) Sağlık Takvimi
- **Aşı & parazit**: Veteriner çizelgesini takip edin.
- **Diş bakımı**: Haftada 2–3 kez fırçalama veya onaylı çiğneme ürünleri.
- **Kilo**: Ayda bir aynı terazide ölçüm yapın.

## SSS
**S: Mama miktarını neye göre artırırım?**  
**C:** Aktivite artışı veya veteriner önerisi yoksa artırmayın; obezite riski yükselir.

**S: Evde uzun süre yalnız kalacaksa?**  
**C:** Otomatik su/mama + zeka oyuncağı + ziyaret planı şart. 24+ saat yalnızlık önerilmez.

**Özet:** Tutarlı rutin + güvenli ortam + düzenli sağlık kontrolleri = mutlu bir dost.
      `,
      imageUrl:
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600",
      date: "2025-08-11",
      author: "Evinde Besle",
      tags: ["Pet Care", "Bakım", "Evde Bakım"],
      category: "Pet Care",
    },
    {
      title: "Tatile Çıkarken Evcil Hayvan Bakımı Nasıl Olmalı?",
      slug: "tatile-cikarken-evcil-hayvan-bakimi",
      excerpt:
        "Tatil öncesi bakıcı seçimi, yazılı bakım notu, erişim bilgileri ve günlük raporlama: sorunsuz bir tatil için kontrol listesi burada.",
      content: `
# Tatile Çıkarken Evcil Hayvan Bakımı Nasıl Olmalı?

Tatile çıkarken evcil dostu evde bırakmak, *iyi planlama* gerektirir. Aşağıdaki kontrol listesi süreci kolaylaştırır.

## 1) Bakıcı Seçimi
- Daha önce referansı olan birini tercih edin.
- Tatilden **önce tanışma ziyareti** planlayın; anahtar teslimini ve ev kurallarını konuşun.

## 2) Yazılı Bakım Notu
- Mama ölçüsü ve saatleri  
- İlaçlar/alerjiler, uygulama talimatı  
- Oyun tercihleri ve sevmediği davranışlar  
- Acil durum veterineri ve sizin iletişiminiz  

\`\`\`
Örnek Not
- Sabah 08:00: 60 gr mama, su yenileme
- Akşam 19:00: 60 gr mama
- Günlük 2x oyun (10 dk oltalı oyuncak)
- Alerji: Tavuk - verilmez
- Vet: X Klinik 0(216)...
\`\`\`

## 3) Erişim ve Güvenlik
- Kilit kutusu şifresi veya komşu teslim planı.
- Kamera varsa **bakıcıya bilgi** verin (aydınlatma metni).
- Pencereler kapalı, sineklik sağlam, deterjanlar kilitli.

## 4) Raporlama
- Günlük **fotoğraf + kısa not** isteyin (mama-su-oyun-tuvalet bilgisi).
- Olağan dışı durumda hızlı arama için iletişim saatlerini belirtin.

## 5) Sık Sorulanlar
**S: Otomatik mama/su cihazı yeterli mi?**  
**C:** Yalnız başına yeterli değil; insan kontrolü şart. Boşalma/arıza riski var.

**S: Bakıcı kaç kez gelmeli?**  
**C:** Kedi için günde 1–2 ziyaret; köpek için yürüyüş planına göre daha sık.

**Sonuç:** Plan + şeffaf iletişim + yazılı talimat = huzurlu tatil.
      `,
      imageUrl:
        "https://images.unsplash.com/photo-1525253013412-55c1a69a5738?q=80&w=1600",
      date: "2025-08-12",
      author: "Evinde Besle",
      tags: ["Tatil", "Bakıcı", "Evde Bakım"],
      category: "Pet Care",
    },
    {
      title: "Kediler İçin Ev Ortamı Zenginleştirme Rehberi",
      slug: "kediler-icin-ev-ortami-zenginlestirme",
      excerpt:
        "Dikey alanlar, tırmalama ve oyun döngüsü ile davranış sorunlarını azaltın. Kedi dostu ev kurmanın pratik yolları.",
      content: `
# Kediler İçin Ev Ortamı Zenginleştirme Rehberi

Kediler avcıdır; tırmanmak, saklanmak ve gözlemlemek ister. **Çevresel zenginleştirme** davranış sorunlarını azaltır.

## 1) Dikey Alanlar
- Duvar rafları, pencere önü platformları, kedi ağaçları.
- Yüksek noktalar arasında **bağlantı** kurun (2–3 raf ardışık).

## 2) Tırmalama İhtiyacı
- Kenevir/sisal direk ve yatay karton pedleri bir arada sunun.
- Tırmalamayı **mevcut mobilya yakınına** konumlandırın ve kediotu serpin.

## 3) Oyun Döngüsü (Avla–Yakala–Ye–Dinlen)
1. Oltalı oyuncakla 5–10 dk aktif oyun  
2. Küçük ödül  
3. Sessiz dinlenme alanı  
> Bu döngü akşam enerjisini boşaltır, gece saldırganlığını azaltır.

## 4) Koku ve Kum Yönetimi
- Kum kabı sayısı: **kedi sayısı + 1**.  
- Günlük topalama, haftalık tam yenileme.  
- Koku için karbon filtreli kap veya oda spreyi değil **havalandırma** tercih edin.

## 5) Güvenlik
- Zehirli bitkiler (zambak, difenbahya) uzaklaştırılsın.
- Pencerelere sağlam sineklik; balkon için ağ.

## SSS
**S: Oyunlara ilgisi yok, ne yapayım?**  
**C:** Av refleksini uyandıran *hareketli* oyuncakları deneyin; oyun saatini öğün öncesine alın.

**S: Tırmalama direğini kullanmıyor?**  
**C:** Direği sallanmayacak şekilde sabitleyin, mobilya yakınına koyun, kediotu serpin.
      `,
      imageUrl:
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1600",
      date: "2025-08-13",
      author: "Evinde Besle",
      tags: ["Kedi", "Zenginleştirme", "Davranış"],
      category: "Kedi Bakımı",
    },
    {
      title: "Köpeklerde Günlük Egzersiz ve Yürüyüş Rehberi",
      slug: "kopeklerde-gunluk-egzersiz-yuruyus",
      excerpt:
        "Irka ve yaşa göre doğru süreler, uygun ekipman, şehir içinde güvenli rota ve zihin oyunları: sağlıklı bir köpek için temel kılavuz.",
      content: `
# Köpeklerde Günlük Egzersiz ve Yürüyüş Rehberi

Yeterli egzersiz; kilo kontrolü, anksiyete ve tahripkâr davranışların azaltılmasında kilittir.

## 1) Ne Kadar Süre?
- **Yavru**: Kısa ve sık (günde 3–4 kez 10–15 dk)
- **Yetişkin**: Günde **60–90 dk** toplam aktivite
- **Yaşlı**: Düşük tempolu, eklem dostu kısa yürüyüşler

> Irka göre değişir: İş köpekleri (Border Collie, Husky) daha fazla zihinsel uyarım ister.

## 2) Ekipman
- **Y çekimli göğüs tasması** + sağlam tasma (çekmeyi azaltır).
- Gece için yansıtıcı yaka/ışıklı aksesuar.
- Yazın katlanır su kabı, kışın yağmurluk/pati koruyucu.

## 3) Rota ve Güvenlik
- Asfalt sıcaklığını kontrol edin (el testi). Sıcak günlerde gölgeli rotalar.
- Trafik, inşaat ve kalabalık bölgelerden kaçının.
- Sokak köpekleriyle kontrollü mesafe; gerginlikte rotayı değiştirin.

## 4) Zihin Oyunları
- **Koklama yürüyüşü** (serbest koklama için zaman bırakın).
- Evde: Snuffle mat, bulmaca mama kapları, temel itaat egzersizleri (otur-bekle).

## 5) Sosyalleşme
- Kısa, olumlu karşılaşmalar; ödül + mesafe yönetimi.
- Mama/oyuncak gibi kaynaklarda korumacılık işareti varsa uzman desteği alın.

## SSS
**S: Çekiştiriyor, yürüyüş işkence.**  
**C:** Y göğüs tasması kullanın, *dön* ve *yanımda* komutlarını ödülle pekiştirin. Kısa seanslar yapın.

**S: Yaz sıcağında ne yapmalı?**  
**C:** Sabah erken/akşam geç yürüyüş; gölge + su molası. 28°C üstünde tempoyu düşürün.
      `,
      imageUrl:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600",
      date: "2025-08-14",
      author: "Evinde Besle",
      tags: ["Köpek", "Egzersiz", "Yürüyüş"],
      category: "Köpek Bakımı",
    },
  ];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedPosts(
  slug: string,
  category: string,
  limit = 3
): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.slug !== slug && p.category === category).slice(0, limit);
}
