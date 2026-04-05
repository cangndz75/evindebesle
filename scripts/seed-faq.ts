import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const faqData = [
    {
        question: "SipariÅŸimi nasÄ±l takip edebilirim?",
        answer: "SipariÅŸ verdikten sonra e-posta adresinize gÃ¶nderilen kargo takip numarasÄ± ile sipariÅŸinizi takip edebilirsiniz. AyrÄ±ca <strong>HesabÄ±m â†’ SipariÅŸlerim</strong> sayfasÄ±ndan sipariÅŸ durumunuzu anlÄ±k olarak gÃ¶rÃ¼ntÃ¼leyebilirsiniz.",
        category: "order",
        order: 1,
    },
    {
        question: "SipariÅŸimi iptal edebilir miyim?",
        answer: "SipariÅŸiniz kargoya verilmeden Ã¶nce iptal edebilirsiniz. Bunun iÃ§in <strong>HesabÄ±m â†’ SipariÅŸlerim</strong> sayfasÄ±ndan ilgili sipariÅŸi seÃ§erek \"Ä°ptal Et\" butonuna tÄ±klayabilirsiniz. Kargoya verildikten sonra iptal iÅŸlemi yapÄ±lamamakta olup, Ã¼rÃ¼n elinize ulaÅŸtÄ±ktan sonra iade baÅŸvurusu oluÅŸturabilirsiniz.",
        category: "order",
        order: 2,
    },
    {
        question: "SipariÅŸimi verdikten sonra adres deÄŸiÅŸikliÄŸi yapabilir miyim?",
        answer: "SipariÅŸiniz henÃ¼z hazÄ±rlanma aÅŸamasÄ±na geÃ§mediyse adres deÄŸiÅŸikliÄŸi yapÄ±labilir. Bunun iÃ§in en kÄ±sa sÃ¼rede mÃ¼ÅŸteri hizmetlerimizle <strong>Bize UlaÅŸÄ±n</strong> sayfasÄ± Ã¼zerinden iletiÅŸime geÃ§menizi rica ederiz.",
        category: "order",
        order: 3,
    },
    {
        question: "Minimum sipariÅŸ tutarÄ± var mÄ±?",
        answer: "Sitemizde minimum sipariÅŸ tutarÄ± bulunmamaktadÄ±r. DilediÄŸiniz miktarda alÄ±ÅŸveriÅŸ yapabilirsiniz. Ancak <strong>150 TL</strong> ve Ã¼zeri sipariÅŸlerde Ã¼cretsiz kargo avantajÄ±ndan yararlanabilirsiniz.",
        category: "order",
        order: 4,
    },
    {
        question: "SipariÅŸim ne zaman kargoya verilir?",
        answer: "SipariÅŸleriniz, Ã¶deme onayÄ±nÄ±n alÄ±nmasÄ±nÄ±n ardÄ±ndan genellikle <strong>1-2 iÅŸ gÃ¼nÃ¼</strong> iÃ§erisinde kargoya teslim edilir. YoÄŸun kampanya dÃ¶nemlerinde bu sÃ¼re biraz uzayabilir.",
        category: "order",
        order: 5,
    },

    {
        question: "Hangi Ã¶deme yÃ¶ntemlerini kullanabilirim?",
        answer: "Sitemizde <strong>kredi kartÄ±</strong>, <strong>banka kartÄ±</strong> ve <strong>sanal kart</strong> ile gÃ¼venli Ã¶deme yapabilirsiniz. TÃ¼m Ã¶demeler iyzico gÃ¼venli Ã¶deme altyapÄ±sÄ± Ã¼zerinden gerÃ§ekleÅŸtirilmektedir. Visa, MasterCard ve Troy kartlarÄ± kabul edilmektedir.",
        category: "payment",
        order: 1,
    },
    {
        question: "Taksitli Ã¶deme yapabilir miyim?",
        answer: "Evet, anlaÅŸmalÄ± banka kartlarÄ±yla <strong>2, 3, 6 ve 9 taksit</strong> seÃ§eneklerinden faydalanabilirsiniz. Taksit seÃ§enekleri Ã¶deme sayfasÄ±nda kartÄ±nÄ±za gÃ¶re otomatik olarak gÃ¶rÃ¼ntÃ¼lenir.",
        category: "payment",
        order: 2,
    },
    {
        question: "Ã–deme bilgilerim gÃ¼vende mi?",
        answer: "Kesinlikle evet. TÃ¼m Ã¶demeleriniz <strong>iyzico</strong> gÃ¼venli Ã¶deme altyapÄ±sÄ± Ã¼zerinden, <strong>256-bit SSL</strong> ÅŸifreleme ile gerÃ§ekleÅŸtirilmektedir. Kart bilgileriniz hiÃ§bir ÅŸekilde sunucularÄ±mÄ±zda saklanmamaktadÄ±r. Ä°yzico, BDDK lisanslÄ± bir Ã¶deme kuruluÅŸudur.",
        category: "payment",
        order: 3,
    },
    {
        question: "Ã–deme sÄ±rasÄ±nda hata alÄ±yorum, ne yapmalÄ±yÄ±m?",
        answer: "Ã–deme hatasÄ± almanÄ±zÄ±n birkaÃ§ nedeni olabilir: <ul class='list-disc pl-5 mt-2 space-y-1'><li>Kart limitinizin yeterli olduÄŸundan emin olun</li><li>Kart bilgilerinizi doÄŸru girdiÄŸinizden emin olun</li><li>3D Secure doÄŸrulamasÄ±nÄ± onayladÄ±ÄŸÄ±nÄ±zdan emin olun</li><li>BankanÄ±zÄ±n online alÄ±ÅŸveriÅŸe izin verdiÄŸinden emin olun</li></ul><br/>Sorun devam ederse farklÄ± bir kart deneyebilir veya mÃ¼ÅŸteri hizmetlerimizle iletiÅŸime geÃ§ebilirsiniz.",
        category: "payment",
        order: 4,
    },
    {
        question: "Fatura bilgilerimi nasÄ±l gÃ¼ncellerim?",
        answer: "SipariÅŸ oluÅŸtururken fatura bilgilerinizi girebilirsiniz. Mevcut faturalarÄ±nÄ±z iÃ§in <strong>HesabÄ±m â†’ SipariÅŸlerim</strong> sayfasÄ±ndan ilgili sipariÅŸin detaylarÄ±na giderek faturanÄ±zÄ± gÃ¶rÃ¼ntÃ¼leyebilirsiniz. Fatura dÃ¼zeltmeleri iÃ§in mÃ¼ÅŸteri hizmetlerimize baÅŸvurabilirsiniz.",
        category: "payment",
        order: 5,
    },

    {
        question: "Kargo Ã¼creti ne kadar?",
        answer: "<strong>150 TL</strong> ve Ã¼zeri sipariÅŸlerde kargo Ã¼cretsizdir. Bu tutarÄ±n altÄ±ndaki sipariÅŸlerde kargo Ã¼creti <strong>49,90 TL</strong> olarak uygulanmaktadÄ±r.",
        category: "shipping",
        order: 1,
    },
    {
        question: "SipariÅŸim kaÃ§ gÃ¼nde elime ulaÅŸÄ±r?",
        answer: "SipariÅŸleriniz kargoya verildikten sonra <strong>1-3 iÅŸ gÃ¼nÃ¼</strong> iÃ§erisinde teslim edilmektedir. BÃ¼yÃ¼kÅŸehirlere teslimat genellikle 1-2 iÅŸ gÃ¼nÃ¼, diÄŸer illere 2-3 iÅŸ gÃ¼nÃ¼ sÃ¼rmektedir.",
        category: "shipping",
        order: 2,
    },
    {
        question: "Hangi kargo firmasÄ± ile gÃ¶nderim yapÄ±lÄ±yor?",
        answer: "SipariÅŸleriniz <strong>YurtiÃ§i Kargo</strong>, <strong>Aras Kargo</strong> veya <strong>MNG Kargo</strong> ile gÃ¶nderilmektedir. Kargo firmasÄ± tercihi sipariÅŸ yoÄŸunluÄŸuna ve bÃ¶lgenize gÃ¶re belirlenmektedir.",
        category: "shipping",
        order: 3,
    },
    {
        question: "Kargom teslim edilemiyor, ne yapmalÄ±yÄ±m?",
        answer: "Kargo teslimatÄ±nda sorun yaÅŸÄ±yorsanÄ±z Ã¶ncelikle kargo takip numaranÄ±z ile kargo firmasÄ±nÄ±n mÃ¼ÅŸteri hizmetlerinden durumu sorgulayabilirsiniz. Kargo ÅŸubesinden teslim almak isterseniz ilgili ÅŸubeye kimliÄŸinizle baÅŸvurabilirsiniz. Sorununuz Ã§Ã¶zÃ¼lmezse <strong>Bize UlaÅŸÄ±n</strong> sayfamÄ±z Ã¼zerinden destek talebinde bulunabilirsiniz.",
        category: "shipping",
        order: 4,
    },
    {
        question: "Yurt dÄ±ÅŸÄ±na gÃ¶nderim yapÄ±yor musunuz?",
        answer: "Åu an iÃ§in yalnÄ±zca <strong>TÃ¼rkiye genelinde</strong> kargo gÃ¶nderimi yapmaktayÄ±z. Yurt dÄ±ÅŸÄ± gÃ¶nderim seÃ§enekleri yakÄ±nda hizmete sunulacaktÄ±r.",
        category: "shipping",
        order: 5,
    },

    {
        question: "Ä°ade ve deÄŸiÅŸim koÅŸullarÄ± nelerdir?",
        answer: "ÃœrÃ¼nlerinizi teslim aldÄ±ÄŸÄ±nÄ±z tarihten itibaren <strong>14 gÃ¼n</strong> iÃ§erisinde iade veya deÄŸiÅŸim talebinde bulunabilirsiniz. Ä°ade edilecek Ã¼rÃ¼nlerin kullanÄ±lmamÄ±ÅŸ, yÄ±kanmamÄ±ÅŸ, etiketi sÃ¶kÃ¼lmemiÅŸ ve orijinal ambalajÄ±nda olmasÄ± gerekmektedir.",
        category: "return",
        order: 1,
    },
    {
        question: "Ä°ade iÅŸlemini nasÄ±l baÅŸlatabilirim?",
        answer: "<strong>HesabÄ±m â†’ SipariÅŸlerim</strong> sayfasÄ±ndan ilgili sipariÅŸi bulup \"Ä°ade Talebi OluÅŸtur\" butonuna tÄ±klayarak iade sÃ¼recini baÅŸlatabilirsiniz. Ä°ade nedeninizi seÃ§ip, gerekirse Ã¼rÃ¼n fotoÄŸraflarÄ±nÄ± yÃ¼kleyerek talebinizi gÃ¶nderebilirsiniz. Ä°ade talebiniz onaylandÄ±ktan sonra kargo kodu e-posta ile tarafÄ±nÄ±za iletilecektir.",
        category: "return",
        order: 2,
    },
    {
        question: "Ä°ade kargo Ã¼creti kime aittir?",
        answer: "ÃœrÃ¼n kusurlu veya hatalÄ± gÃ¶nderim durumlarÄ±nda iade kargo Ã¼creti <strong>firmamÄ±za</strong> aittir. MÃ¼ÅŸteri kaynaklÄ± iade taleplerinde (beÄŸenmeme, beden uyumsuzluÄŸu vb.) iade kargo Ã¼creti <strong>alÄ±cÄ±ya</strong> aittir.",
        category: "return",
        order: 3,
    },
    {
        question: "Ä°ade ettiÄŸim Ã¼rÃ¼nÃ¼n parasÄ± ne zaman iade edilir?",
        answer: "Ä°ade edilen Ã¼rÃ¼nÃ¼nÃ¼z depomÄ±za ulaÅŸÄ±p kontrol edildikten sonra <strong>3-5 iÅŸ gÃ¼nÃ¼</strong> iÃ§erisinde Ã¶demeniz iade edilir. Kredi kartÄ±na yapÄ±lan iadelerde bankanÄ±zÄ±n sÃ¼reci nedeniyle tutarÄ±n hesabÄ±nÄ±za yansÄ±masÄ± ek olarak <strong>7-14 iÅŸ gÃ¼nÃ¼</strong> sÃ¼rebilir.",
        category: "return",
        order: 4,
    },
    {
        question: "Hangi Ã¼rÃ¼nler iade edilemez?",
        answer: "AÅŸaÄŸÄ±daki durumlarda iade kabul edilememektedir:<ul class='list-disc pl-5 mt-2 space-y-1'><li>KullanÄ±lmÄ±ÅŸ, yÄ±kanmÄ±ÅŸ veya hasar gÃ¶rmÃ¼ÅŸ Ã¼rÃ¼nler</li><li>Etiketi Ã§Ä±karÄ±lmÄ±ÅŸ veya kesilmiÅŸ Ã¼rÃ¼nler</li><li>Orijinal ambalajÄ± aÃ§Ä±lmÄ±ÅŸ iÃ§ giyim Ã¼rÃ¼nleri (hijyen nedeniyle)</li><li>Orijinal ambalajÄ± aÃ§Ä±lmÄ±ÅŸ mayo ve bikini Ã¼rÃ¼nleri</li></ul>",
        category: "return",
        order: 5,
    },

    {
        question: "Beden tablosu nasÄ±l kullanÄ±lÄ±r?",
        answer: "Her Ã¼rÃ¼n sayfasÄ±nda detaylÄ± <strong>beden tablosu</strong> bulunmaktadÄ±r. VÃ¼cut Ã¶lÃ§Ã¼lerinize gÃ¶re en uygun bedeni seÃ§ebilirsiniz. Ã–lÃ§Ã¼lerinizi mezura ile alarak tablodaki deÄŸerlerle karÅŸÄ±laÅŸtÄ±rmanÄ±zÄ± Ã¶neririz. EÄŸer iki beden arasÄ±nda kaldÄ±ysanÄ±z, rahat bir kullanÄ±m iÃ§in bÃ¼yÃ¼k bedeni tercih etmenizi tavsiye ederiz.",
        category: "product",
        order: 1,
    },
    {
        question: "ÃœrÃ¼n renkleri gerÃ§eÄŸiyle birebir aynÄ± mÄ±?",
        answer: "ÃœrÃ¼n fotoÄŸraflarÄ± profesyonel ortamda Ã§ekilmektedir, ancak monitÃ¶r ve ekran ayarlarÄ±na baÄŸlÄ± olarak renklerde <strong>hafif ton farklÄ±lÄ±klarÄ±</strong> olabilir. ÃœrÃ¼n aÃ§Ä±klamalarÄ±ndaki renk bilgisini de dikkate almanÄ±zÄ± Ã¶neririz.",
        category: "product",
        order: 2,
    },
    {
        question: "StoÄŸu tÃ¼kenen Ã¼rÃ¼n tekrar gelecek mi?",
        answer: "StoÄŸu tÃ¼kenen Ã¼rÃ¼nler iÃ§in ilgili Ã¼rÃ¼n sayfasÄ±ndaki <strong>\"Gelince Haber Ver\"</strong> butonuna tÄ±klayarak e-posta bildirimlerine kaydolabilirsiniz. ÃœrÃ¼n tekrar stoklara girdiÄŸinde size otomatik bilgilendirme yapÄ±lacaktÄ±r.",
        category: "product",
        order: 3,
    },
    {
        question: "ÃœrÃ¼nlerin kumaÅŸ iÃ§eriÄŸini nereden Ã¶ÄŸrenebilirim?",
        answer: "Her Ã¼rÃ¼nÃ¼n detay sayfasÄ±nda <strong>kumaÅŸ bilgisi</strong> ve <strong>bakÄ±m talimatlarÄ±</strong> bÃ¶lÃ¼mÃ¼ bulunmaktadÄ±r. Burada Ã¼rÃ¼nÃ¼n malzeme iÃ§eriÄŸi, yÄ±kama talimatlarÄ± ve kullanÄ±m Ã¶nerileri detaylÄ± ÅŸekilde yer almaktadÄ±r.",
        category: "product",
        order: 4,
    },
    {
        question: "ÃœrÃ¼nler orijinal mi?",
        answer: "Sitemizde satÄ±lan tÃ¼m Ã¼rÃ¼nler <strong>%100 orijinal</strong> ve kendi markamÄ±za aittir. TÃ¼m Ã¼rÃ¼nler kalite kontrol sÃ¼reÃ§lerinden geÃ§irildikten sonra satÄ±ÅŸa sunulmaktadÄ±r.",
        category: "product",
        order: 5,
    },

    {
        question: "NasÄ±l Ã¼ye olabilirim?",
        answer: "Ana sayfanÄ±n saÄŸ Ã¼st kÃ¶ÅŸesindeki <strong>\"GiriÅŸ Yap\"</strong> butonuna tÄ±klayarak kayÄ±t formunu doldurabilirsiniz. E-posta adresiniz, adÄ±nÄ±z ve ÅŸifrenizle hÄ±zlÄ±ca Ã¼ye olabilirsiniz. AyrÄ±ca <strong>Google hesabÄ±nÄ±zla</strong> da tek tÄ±kla kayÄ±t olabilirsiniz.",
        category: "account",
        order: 1,
    },
    {
        question: "Åifremi unuttum, ne yapmalÄ±yÄ±m?",
        answer: "GiriÅŸ sayfasÄ±ndaki <strong>\"Åifremi Unuttum\"</strong> baÄŸlantÄ±sÄ±na tÄ±klayarak kayÄ±tlÄ± e-posta adresinizi girin. Size ÅŸifre sÄ±fÄ±rlama baÄŸlantÄ±sÄ± iÃ§eren bir e-posta gÃ¶nderilecektir. E-postadaki baÄŸlantÄ±ya tÄ±klayarak yeni ÅŸifrenizi belirleyebilirsiniz.",
        category: "account",
        order: 2,
    },
    {
        question: "Hesap bilgilerimi nasÄ±l gÃ¼ncellerim?",
        answer: "<strong>HesabÄ±m</strong> sayfasÄ±ndan adÄ±nÄ±zÄ±, e-posta adresinizi, telefon numaranÄ±zÄ± ve adres bilgilerinizi gÃ¼ncelleyebilirsiniz. Åifre deÄŸiÅŸikliÄŸi de yine bu sayfa Ã¼zerinden yapÄ±labilir.",
        category: "account",
        order: 3,
    },
    {
        question: "HesabÄ±mÄ± silmek istiyorum, nasÄ±l yapabilirim?",
        answer: "HesabÄ±nÄ±zÄ± silmek iÃ§in mÃ¼ÅŸteri hizmetlerimizle <strong>Bize UlaÅŸÄ±n</strong> sayfasÄ± Ã¼zerinden iletiÅŸime geÃ§meniz gerekmektedir. Hesap silme talebiniz en geÃ§ <strong>72 saat</strong> iÃ§erisinde iÅŸleme alÄ±nacaktÄ±r. KVKK kapsamÄ±ndaki haklarÄ±nÄ±z saklÄ±dÄ±r.",
        category: "account",
        order: 4,
    },
    {
        question: "Kupon kodum nasÄ±l kullanÄ±lÄ±r?",
        answer: "Sepetinize Ã¼rÃ¼n ekledikten sonra Ã¶deme sayfasÄ±nda bulunan <strong>\"Kupon Kodu\"</strong> alanÄ±na kodunuzu girerek <strong>\"Uygula\"</strong> butonuna tÄ±klayÄ±n. Ä°ndirim otomatik olarak toplam tutarÄ±nÄ±za yansÄ±yacaktÄ±r. Her kupon yalnÄ±zca bir kez kullanÄ±labilir ve belirli bir geÃ§erlilik sÃ¼resi vardÄ±r.",
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
    console.log(`âœ… ${count} FAQ kaydÄ± baÅŸarÄ±yla oluÅŸturuldu!`);
}

seed()
    .catch((e) => {
        console.error("âŒ Seed hatasÄ±:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
