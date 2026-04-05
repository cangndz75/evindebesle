"use client";

import { TruckIcon } from "lucide-react";
import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer";

export default function TeslimatVeIadePage() {
  return (
    <>
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TruckIcon className="text-green-600 w-6 h-6" />
            <h1 className="text-2xl font-bold">Teslimat ve Ä°ade ÅartlarÄ±</h1>
          </div>

          <h2 className="text-lg font-semibold mb-4">Teslimat KoÅŸullarÄ±</h2>
          <p className="mb-6">
            <strong>evindebesle.com</strong> Ã¼zerinden alÄ±nan Ã¼rÃ¼nler,
            sipariÅŸ sÄ±rasÄ±nda belirtilen teslimat sÃ¼releri iÃ§erisinde
            adrese uygun ÅŸekilde ulaÅŸtÄ±rÄ±lÄ±r. TÃ¼m
            Ã¼rÃ¼nlerde kullanÄ±cÄ±larÄ±n seÃ§tiÄŸi beden ve renk
            detaylarÄ±na gÃ¶re gÃ¶nderim yapÄ±lÄ±r.
          </p>

          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>
              Hizmetler yalnÄ±zca platformda belirtilen ilÃ§e sÄ±nÄ±rlarÄ± iÃ§inde
              verilir.
            </li>
            <li>
              Belirtilen hizmet sÃ¼resi iÃ§inde hizmete baÅŸlanamamasÄ± durumunda
              kullanÄ±cÄ± bilgilendirilir.
            </li>
            <li>
              Hizmet Ã¶ncesi kullanÄ±cÄ±dan Ã¶zel hassasiyet bilgileri ve detay
              adres talep edilir.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">
            Ä°ade ve Ä°ptal KoÅŸullarÄ±
          </h2>
          <p className="mb-4">
            SipariÅŸlerinizde iptal ve iade iÅŸlemleri aÅŸaÄŸÄ±daki
            kurallara gÃ¶re gerÃ§ekleÅŸtirilir:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>
              ÃœrÃ¼n teslimatÄ±ndan sonra <strong>14 gÃ¼n iÃ§inde</strong> sebep gÃ¶stermeksizin iade hakkÄ±nÄ±z bulunmaktadÄ±r.
            </li>
            <li>
              Ä°ade edilecek Ã¼rÃ¼nÃ¼n <strong>etiketinin sÃ¶kÃ¼lmemiÅŸ ve kullanÄ±lmamÄ±ÅŸ</strong> olmasÄ± gerekmektedir.
            </li>
            <li>
              Hijyen kurallarÄ± gereÄŸi kÃ¼pe, iÃ§ giyim ve alt grup mayo Ã¼rÃ¼nlerinde iade kabul edilmemektedir.
            </li>
            <li>
              Hizmet saÄŸlayÄ±cÄ± kaynaklÄ± iptallerde, kullanÄ±cÄ±ya{" "}
              <strong>tam Ã¼cret iadesi</strong> yapÄ±lÄ±r veya talebe gÃ¶re yeniden
              planlama saÄŸlanÄ±r.
            </li>
            <li>
              Ã–deme iadeleri, Ã¶demenin yapÄ±ldÄ±ÄŸÄ± kart veya yÃ¶nteme gÃ¶re{" "}
              <strong>7 iÅŸ gÃ¼nÃ¼</strong> iÃ§inde gerÃ§ekleÅŸtirilir.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">Ä°letiÅŸim</h2>
          <p className="mb-6">
            Teslimat veya iade iÅŸlemleriyle ilgili tÃ¼m taleplerinizi{" "}
            <a
              href="mailto:info@dark-velvet.com"
              className="underline text-blue-600"
            >
              info@dark-velvet.com
            </a>{" "}
            adresine iletebilirsiniz.
          </p>

          <p className="text-muted-foreground text-xs">
            Bu metin en son {new Date().toLocaleDateString("tr-TR")} tarihinde
            gÃ¼ncellenmiÅŸtir.
          </p>
        </div>
      </div>
    </>
  );
}
