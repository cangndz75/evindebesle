import { ShieldCheck, Lock, CheckCircle } from "lucide-react";

export default function SecurePaymentInfo() {
  return (
    <div className="bg-muted/40 p-4 rounded-xl mt-6 flex flex-col md:flex-row gap-4 items-center justify-between border">
      <div className="flex items-center gap-3">
        <Lock className="text-green-600 w-6 h-6" />
        <div>
          <p className="text-sm font-semibold">256-bit SSL ile korunmaktadır</p>
          <p className="text-xs text-muted-foreground">
            Bilgileriniz şifreli olarak güvenle iletilir.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ShieldCheck className="text-blue-600 w-6 h-6" />
        <div>
          <p className="text-sm font-semibold">İyzico güvencesiyle ödeme</p>
          <p className="text-xs text-muted-foreground">
            Ödeme işlemleriniz İyzico altyapısıyla güvence altındadır.
          </p>
        </div>
      </div>
    </div>
  );
}
