export function TermsDocumentContent() {
  return (
    <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
      <p>
        Bu web sitesine erişerek ve kullanarak, aşağıda belirtilen kullanım
        koşullarını, yasal şartları ve gizlilik politikamızı hiçbir sınırlama
        olmaksızın kabul etmiş sayılırsınız. <strong>Dark Velvet</strong> bu
        koşulları dilediği zaman önceden haber vermeksizin güncelleme hakkını
        saklı tutar.
      </p>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Üyelik ve Hesap Güvenliği</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Üyelik bilgilerinin doğruluğu kullanıcının sorumluluğundadır.</li>
          <li>Hesap şifresinin gizliliği tamamen kullanıcıya aittir.</li>
          <li>Hesapta gerçekleşen tüm işlemlerden kullanıcı sorumludur.</li>
          <li>Güvenlik şüphesinde hesap askıya alınabilir veya sonlandırılabilir.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Ürünler ve Satış</h3>
        <p>
          Stok ve fiyatlar önceden haber verilmeksizin değiştirilebilir. Teknik
          hatalardan kaynaklanan fiyat yanlışlıklarında sipariş iptal edilebilir
          veya doğru fiyat bildirilebilir.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Fikri Mülkiyet</h3>
        <p>
          Sitedeki tüm içerik Dark Velvet&apos;e aittir; izinsiz kopyalanamaz veya
          dağıtılamaz.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Sorumluluk</h3>
        <p>
          Sitenin kesintisiz çalışacağı garanti edilmez. Dolaylı zararlardan
          şirket sorumlu tutulamaz.
        </p>
      </section>

      <p className="text-xs text-gray-500">Son güncelleme: 22 Şubat 2026</p>
    </div>
  );
}

export function PrivacyDocumentContent() {
  return (
    <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
      <p>
        <strong>dark-velvet.com</strong> olarak kişisel verilerinizin gizliliğine
        ve güvenliğine önem veriyoruz. Bu metin, verilerinizin nasıl toplandığını,
        kullanıldığını, saklandığını ve korunduğunu açıklar.
      </p>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Toplanan Veriler</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Ad, soyad, e-posta, telefon gibi iletişim bilgileri</li>
          <li>Sipariş geçmişi ve kullanıcı tercihleri</li>
          <li>Oturum geçmişi gibi teknik veriler</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Veri Saklama ve Koruma</h3>
        <p>
          Verileriniz şifrelenmiş sunucularda saklanır. Kredi kartı bilgileri
          tarafımızda tutulmaz.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Kullanım Amaçları</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Sipariş yönetimi, teslimat ve destek</li>
          <li>Hizmet iyileştirme analizleri</li>
          <li>Yasal yükümlülükler</li>
          <li>Açık rızaya dayalı kampanya bildirimleri</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Haklarınız (KVKK)</h3>
        <p>
          Verilerinizin işlenip işlenmediğini öğrenme, düzeltme ve silme talep
          etme haklarına sahipsiniz. Taleplerinizi{" "}
          <a
            href="mailto:info@dark-velvet.com"
            className="font-medium text-[#111] underline underline-offset-2"
          >
            info@dark-velvet.com
          </a>{" "}
          adresine iletebilirsiniz.
        </p>
      </section>
    </div>
  );
}
