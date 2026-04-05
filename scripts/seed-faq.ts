import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { normalizeDatabaseUrlForPg } from "../lib/normalize-database-url.js";

dotenv.config();

const pool = new Pool({
    connectionString: normalizeDatabaseUrlForPg(process.env.DATABASE_URL),
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const faqData = [
    {
        question: "Siparişimi nasıl takip edebilirim?",
        answer: "Sipariş verdikten sonra e-posta adresinize gönderilen kargo takip numarası ile siparişinizi takip edebilirsiniz. Ayrıca <strong>Hesabım → Siparişlerim</strong> sayfasından sipariş durumunuzu anlık olarak görüntüleyebilirsiniz.",
        category: "order",
        order: 1,
    },
    {
        question: "Siparişimi iptal edebilir miyim?",
        answer: "Siparişiniz kargoya verilmeden önce iptal edebilirsiniz. Bunun için <strong>Hesabım → Siparişlerim</strong> sayfasından ilgili siparişi seçerek \"İptal Et\" butonuna tıklayabilirsiniz. Kargoya verildikten sonra iptal işlemi yapılamamakta olup, ürün elinize ulaştıktan sonra iade başvurusu oluşturabilirsiniz.",
        category: "order",
        order: 2,
    },
    {
        question: "Siparişimi verdikten sonra adres değişikliği yapabilir miyim?",
        answer: "Siparişiniz henüz hazırlanma aşamasına geçmediyse adres değişikliği yapılabilir. Bunun için en kısa sürede müşteri hizmetlerimizle <strong>Bize Ulaşın</strong> sayfası üzerinden iletişime geçmenizi rica ederiz.",
        category: "order",
        order: 3,
    },
    {
        question: "Minimum sipariş tutarı var mı?",
        answer: "Sitemizde minimum sipariş tutarı bulunmamaktadır. Dilediğiniz miktarda alışveriş yapabilirsiniz. Ancak <strong>150 TL</strong> ve üzeri siparişlerde ücretsiz kargo avantajından yararlanabilirsiniz.",
        category: "order",
        order: 4,
    },
    {
        question: "Siparişim ne zaman kargoya verilir?",
        answer: "Siparişleriniz, ödeme onayının alınmasının ardından genellikle <strong>1-2 iş günü</strong> içerisinde kargoya teslim edilir. Yoğun kampanya dönemlerinde bu süre biraz uzayabilir.",
        category: "order",
        order: 5,
    },

    {
        question: "Hangi ödeme yöntemlerini kullanabilirim?",
        answer: "Sitemizde <strong>kredi kartı</strong>, <strong>banka kartı</strong> ve <strong>sanal kart</strong> ile güvenli ödeme yapabilirsiniz. Tüm ödemeler iyzico güvenli ödeme altyapısı üzerinden gerçekleştirilmektedir. Visa, MasterCard ve Troy kartları kabul edilmektedir.",
        category: "payment",
        order: 1,
    },
    {
        question: "Taksitli ödeme yapabilir miyim?",
        answer: "Evet, anlaşmalı banka kartlarıyla <strong>2, 3, 6 ve 9 taksit</strong> seçeneklerinden faydalanabilirsiniz. Taksit seçenekleri ödeme sayfasında kartınıza göre otomatik olarak görüntülenir.",
        category: "payment",
        order: 2,
    },
    {
        question: "Ödeme bilgilerim güvende mi?",
        answer: "Kesinlikle evet. Tüm ödemeleriniz <strong>iyzico</strong> güvenli ödeme altyapısı üzerinden, <strong>256-bit SSL</strong> şifreleme ile gerçekleştirilmektedir. Kart bilgileriniz hiçbir şekilde sunucularımızda saklanmamaktadır. İyzico, BDDK lisanslı bir ödeme kuruluşudur.",
        category: "payment",
        order: 3,
    },
    {
        question: "Ödeme sırasında hata alıyorum, ne yapmalıyım?",
        answer: "Ödeme hatası almanızın birkaç nedeni olabilir: <ul class='list-disc pl-5 mt-2 space-y-1'><li>Kart limitinizin yeterli olduğundan emin olun</li><li>Kart bilgilerinizi doğru girdiğinizden emin olun</li><li>3D Secure doğrulamasını onayladığınızdan emin olun</li><li>Bankanızın online alışverişe izin verdiğinden emin olun</li></ul><br/>Sorun devam ederse farklı bir kart deneyebilir veya müşteri hizmetlerimizle iletişime geçebilirsiniz.",
        category: "payment",
        order: 4,
    },
    {
        question: "Fatura bilgilerimi nasıl güncellerim?",
        answer: "Sipariş oluştururken fatura bilgilerinizi girebilirsiniz. Mevcut faturalarınız için <strong>Hesabım → Siparişlerim</strong> sayfasından ilgili siparişin detaylarına giderek faturanızı görüntüleyebilirsiniz. Fatura düzeltmeleri için müşteri hizmetlerimize başvurabilirsiniz.",
        category: "payment",
        order: 5,
    },

    {
        question: "Kargo ücreti ne kadar?",
        answer: "<strong>150 TL</strong> ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde kargo ücreti <strong>49,90 TL</strong> olarak uygulanmaktadır.",
        category: "shipping",
        order: 1,
    },
    {
        question: "Siparişim kaç günde elime ulaşır?",
        answer: "Siparişleriniz kargoya verildikten sonra <strong>1-3 iş günü</strong> içerisinde teslim edilmektedir. Büyükşehirlere teslimat genellikle 1-2 iş günü, diğer illere 2-3 iş günü sürmektedir.",
        category: "shipping",
        order: 2,
    },
    {
        question: "Hangi kargo firması ile gönderim yapılıyor?",
        answer: "Siparişleriniz <strong>Yurtiçi Kargo</strong>, <strong>Aras Kargo</strong> veya <strong>MNG Kargo</strong> ile gönderilmektedir. Kargo firması tercihi sipariş yoğunluğuna ve bölgenize göre belirlenmektedir.",
        category: "shipping",
        order: 3,
    },
    {
        question: "Kargom teslim edilemiyor, ne yapmalıyım?",
        answer: "Kargo teslimatında sorun yaşıyorsanız öncelikle kargo takip numaranız ile kargo firmasının müşteri hizmetlerinden durumu sorgulayabilirsiniz. Kargo şubesinden teslim almak isterseniz ilgili şubeye kimliğinizle başvurabilirsiniz. Sorununuz çözülmezse <strong>Bize Ulaşın</strong> sayfamız üzerinden destek talebinde bulunabilirsiniz.",
        category: "shipping",
        order: 4,
    },
    {
        question: "Yurt dışına gönderim yapıyor musunuz?",
        answer: "Şu an için yalnızca <strong>Türkiye genelinde</strong> kargo gönderimi yapmaktayız. Yurt dışı gönderim seçenekleri yakında hizmete sunulacaktır.",
        category: "shipping",
        order: 5,
    },

    {
        question: "İade ve değişim koşulları nelerdir?",
        answer: "Ürünlerinizi teslim aldığınız tarihten itibaren <strong>14 gün</strong> içerisinde iade veya değişim talebinde bulunabilirsiniz. İade edilecek ürünlerin kullanılmamış, yıkanmamış, etiketi sökülmemiş ve orijinal ambalajında olması gerekmektedir.",
        category: "return",
        order: 1,
    },
    {
        question: "İade işlemini nasıl başlatabilirim?",
        answer: "<strong>Hesabım → Siparişlerim</strong> sayfasından ilgili siparişi bulup \"İade Talebi Oluştur\" butonuna tıklayarak iade sürecini başlatabilirsiniz. İade nedeninizi seçip, gerekirse ürün fotoğraflarını yükleyerek talebinizi gönderebilirsiniz. İade talebiniz onaylandıktan sonra kargo kodu e-posta ile tarafınıza iletilecektir.",
        category: "return",
        order: 2,
    },
    {
        question: "İade kargo ücreti kime aittir?",
        answer: "Ürün kusurlu veya hatalı gönderim durumlarında iade kargo ücreti <strong>firmamıza</strong> aittir. Müşteri kaynaklı iade taleplerinde (beğenmeme, beden uyumsuzluğu vb.) iade kargo ücreti <strong>alıcıya</strong> aittir.",
        category: "return",
        order: 3,
    },
    {
        question: "İade ettiğim ürünün parası ne zaman iade edilir?",
        answer: "İade edilen ürününüz depomıza ulaşıp kontrol edildikten sonra <strong>3-5 iş günü</strong> içerisinde ödemeniz iade edilir. Kredi kartına yapılan iadelerde bankanızın süreci nedeniyle tutarın hesabınıza yansıması ek olarak <strong>7-14 iş günü</strong> sürebilir.",
        category: "return",
        order: 4,
    },
    {
        question: "Hangi ürünler iade edilemez?",
        answer: "Aşağıdaki durumlarda iade kabul edilememektedir:<ul class='list-disc pl-5 mt-2 space-y-1'><li>Kullanılmış, yıkanmış veya hasar görmüş ürünler</li><li>Etiketi çıkarılmış veya kesilmiş ürünler</li><li>Orijinal ambalajı açılmış iç giyim ürünleri (hijyen nedeniyle)</li><li>Orijinal ambalajı açılmış mayo ve bikini ürünleri</li></ul>",
        category: "return",
        order: 5,
    },

    {
        question: "Beden tablosu nasıl kullanılır?",
        answer: "Her ürün sayfasında detaylı <strong>beden tablosu</strong> bulunmaktadır. Vücut ölçülerinize göre en uygun bedeni seçebilirsiniz. Ölçülerinizi mezura ile alarak tablodaki değerlerle karşılaştırmanızı öneririz. Eğer iki beden arasında kaldıysanız, rahat bir kullanım için büyük bedeni tercih etmenizi tavsiye ederiz.",
        category: "product",
        order: 1,
    },
    {
        question: "Ürün renkleri gerçeğiyle birebir aynı mı?",
        answer: "Ürün fotoğrafları profesyonel ortamda çekilmektedir, ancak monitör ve ekran ayarlarına bağlı olarak renklerde <strong>hafif ton farklılıkları</strong> olabilir. Ürün açıklamalarındaki renk bilgisini de dikkate almanızı öneririz.",
        category: "product",
        order: 2,
    },
    {
        question: "Stoğu tükenen ürün tekrar gelecek mi?",
        answer: "Stoğu tükenen ürünler için ilgili ürün sayfasındaki <strong>\"Gelince Haber Ver\"</strong> butonuna tıklayarak e-posta bildirimlerine kaydolabilirsiniz. Ürün tekrar stoklara girdiğinde size otomatik bilgilendirme yapılacaktır.",
        category: "product",
        order: 3,
    },
    {
        question: "Ürünlerin kumaş içeriğini nereden öğrenebilirim?",
        answer: "Her ürünün detay sayfasında <strong>kumaş bilgisi</strong> ve <strong>bakım talimatları</strong> bölümü bulunmaktadır. Burada ürünün malzeme içeriği, yıkama talimatları ve kullanım önerileri detaylı şekilde yer almaktadır.",
        category: "product",
        order: 4,
    },
    {
        question: "Ürünler orijinal mi?",
        answer: "Sitemizde satılan tüm ürünler <strong>%100 orijinal</strong> ve kendi markamıza aittir. Tüm ürünler kalite kontrol süreçlerinden geçirildikten sonra satışa sunulmaktadır.",
        category: "product",
        order: 5,
    },

    {
        question: "Nasıl üye olabilirim?",
        answer: "Ana sayfanın sağ üst köşesindeki <strong>\"Giriş Yap\"</strong> butonuna tıklayarak kayıt formunu doldurabilirsiniz. E-posta adresiniz, adınız ve şifrenizle hızlıca üye olabilirsiniz. Ayrıca <strong>Google hesabınızla</strong> da tek tıkla kayıt olabilirsiniz.",
        category: "account",
        order: 1,
    },
    {
        question: "Şifremi unuttum, ne yapmalıyım?",
        answer: "Giriş sayfasındaki <strong>\"Şifremi Unuttum\"</strong> bağlantısına tıklayarak kayıtlı e-posta adresinizi girin. Size şifre sıfırlama bağlantısı içeren bir e-posta gönderilecektir. E-postadaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz.",
        category: "account",
        order: 2,
    },
    {
        question: "Hesap bilgilerimi nasıl güncellerim?",
        answer: "<strong>Hesabım</strong> sayfasından adınızı, e-posta adresinizi, telefon numaranızı ve adres bilgilerinizi güncelleyebilirsiniz. Şifre değişikliği de yine bu sayfa üzerinden yapılabilir.",
        category: "account",
        order: 3,
    },
    {
        question: "Hesabımı silmek istiyorum, nasıl yapabilirim?",
        answer: "Hesabınızı silmek için müşteri hizmetlerimizle <strong>Bize Ulaşın</strong> sayfası üzerinden iletişime geçmeniz gerekmektedir. Hesap silme talebiniz en geç <strong>72 saat</strong> içerisinde işleme alınacaktır. KVKK kapsamındaki haklarınız saklıdır.",
        category: "account",
        order: 4,
    },
    {
        question: "Kupon kodum nasıl kullanılır?",
        answer: "Sepetinize ürün ekledikten sonra ödeme sayfasında bulunan <strong>\"Kupon Kodu\"</strong> alanına kodunuzu girerek <strong>\"Uygula\"</strong> butonuna tıklayın. İndirim otomatik olarak toplam tutarınıza yansıyacaktır. Her kupon yalnızca bir kez kullanılabilir ve belirli bir geçerlilik süresi vardır.",
        category: "account",
        order: 5,
    },
];

async function seed() {
    console.log("ğŸ”„ Mevcut FAQ verileri siliniyor...");
    await prisma.fAQ.deleteMany();

    console.log("ğŸ“ Yeni FAQ verileri ekleniyor...");
    for (const faq of faqData) {
        await prisma.fAQ.create({
            data: {
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                order: faq.order,
                isActive: true,
            },
        });
    }

    const count = await prisma.fAQ.count();
    console.log(`✅ ${count} FAQ kaydı başarıyla oluşturuldu!`);
}

seed()
    .catch((e) => {
        console.error("âŒ Seed hatası:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
