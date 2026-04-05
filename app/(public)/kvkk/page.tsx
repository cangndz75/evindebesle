import { ShieldCheck, FileText, Database, Lock, Users, Mail } from "lucide-react";

export const metadata = {
    title: "K.V.K.K. Aydınlatma Metni | Dark Velvet",
    description: "Dark Velvet K.V.K.K. kapsamında kişisel verilerin korunması aydınlatma metni.",
};

export default function KVKKPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">K.V.K.K. Aydınlatma Metni</h1>
                    <p className="text-gray-300">6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <p className="text-gray-700 leading-relaxed">
                        <strong>Dark Velvet</strong> olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında, veri sorumlusu sıfatıyla, kişisel verilerinizin hukuka uygun bir biçimde işlenmesi, saklanması ve paylaşılmasına büyük önem vermekteyiz. Bu aydınlatma metni, kişisel verilerinizin nasıl toplandığını, hangi amaçlarla kullanıldığını ve haklarınızı açıklamaktadır.
                    </p>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Veri Sorumlusu</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                        <strong>Unvan:</strong> Dark Velvet Tekstil Ticaret A.Ş.<br />
                        <strong>Adres:</strong> Uptwins Blok, Orta, Yalnız Selvi Cd. No: 5AB, 34880 Kartal/İstanbul<br />
                        <strong>E-posta:</strong> <a href="mailto:kvkk@darkvelvet.com" className="text-indigo-600 hover:underline">kvkk@darkvelvet.com</a><br />
                        <strong>Telefon:</strong> +90 216 519 26 00
                    </p>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                            <Database className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">İşlenen Kişisel Veriler</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { category: "Kimlik Bilgileri", items: "Ad, soyad, T.C. kimlik numarası, doğum tarihi" },
                            { category: "İletişim Bilgileri", items: "E-posta adresi, telefon numarası, adres" },
                            { category: "Müşteri İşlem Bilgileri", items: "Sipariş geçmişi, ödeme bilgileri, fatura detayları" },
                            { category: "Dijital İz Bilgileri", items: "IP adresi, çerez verileri, tarayıcı bilgileri, oturum süreleri" },
                            { category: "Pazarlama Bilgileri", items: "Alışveriş tercihleri, kampanya katılım bilgileri" },
                            { category: "Fiziksel Mekan Güvenliği", items: "Mağaza kamera kayıtları (varsa)" },
                        ].map((item, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.category}</h4>
                                <p className="text-gray-600 text-sm">{item.items}</p>
                            </div>
                        ))}
                    </div>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-700">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Kişisel Verilerin İşlenme Amaçları</h2>
                    </div>
                    <ul className="space-y-3">
                        {[
                            "Üyelik kaydı oluşturma ve yönetme",
                            "Sipariş süreçlerinin yürütülmesi ve teslimat işlemleri",
                            "Ödeme işlemlerinin güvenli şekilde gerçekleştirilmesi",
                            "Müşteri memnuniyetine yönelik destek hizmetlerinin sunulması",
                            "Yasal yükümlülüklerin yerine getirilmesi (fatura, vergi vb.)",
                            "Kampanya, promosyon ve kişiselleştirilmiş pazarlama faaliyetleri (açık rıza ile)",
                            "İstatistiksel analizler ve hizmet iyileştirme çalışmaları",
                            "Bilgi güvenliği süreçlerinin yürütülmesi",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Kişisel Verilerin Aktarılması</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Kişisel verileriniz, KVKK&apos;nın 8. ve 9. maddelerinde belirtilen şartlar çerçevesinde aşağıdaki taraflara aktarılabilmektedir:
                    </p>
                    <ul className="space-y-2">
                        {[
                            "Ödeme hizmet sağlayıcıları (iyzico vb.)",
                            "Kargo ve lojistik firmaları",
                            "Hukuki yükümlülükler kapsamında yetkili kamu kurum ve kuruluşları",
                            "Bilgi teknolojileri hizmet sağlayıcıları",
                            "Hukuk danışmanları ve denetim firmaları",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">KVKK Kapsamındaki Haklarınız</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
                            "İşlenmişse buna ilişkin bilgi talep etme",
                            "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
                            "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme",
                            "Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme",
                            "KVKK'nın 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme",
                            "Düzeltme/silme işlemlerinin aktarıldığı 3. kişilere bildirilmesini isteme",
                            "Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme",
                            "Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme",
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                <span className="text-purple-600 font-bold text-sm mt-0.5">{i + 1}.</span>
                                <span className="text-gray-700 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </section>

                
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Başvuru Yöntemi</h3>
                    <p className="text-gray-600 mb-4">
                        Yukarıda belirtilen haklarınızı kullanmak için kimliğinizi tespit edici belgeler ile birlikte
                        yazılı başvurunuzu aşağıdaki adrese veya e-posta adresimize iletebilirsiniz.
                    </p>
                    <a
                        href="mailto:kvkk@darkvelvet.com"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <Mail className="w-4 h-4" />
                        kvkk@darkvelvet.com
                    </a>
                    <p className="text-xs text-gray-500 mt-6">
                        Bu metin en son 21.02.2026 tarihinde güncellenmiştir.
                    </p>
                </section>
            </div>
        </div>
    );
}
