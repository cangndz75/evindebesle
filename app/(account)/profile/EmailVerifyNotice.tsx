'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Mail, X, AlertCircle } from "lucide-react"

export default function EmailVerifyNotice() {
  const [needsVerification, setNeedsVerification] = useState(false)
  const [sending, setSending] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/user/me").then(res => res.json()).then(data => {
      setNeedsVerification(!data.emailVerified)
    })
  }, [])

  const handleSendVerification = async () => {
    setSending(true)
    const res = await fetch("/api/user/send-verification", { method: "POST" })
    setSending(false)

    if (res.ok) {
      toast.success("Doğrulama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.")
    } else {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  if (!needsVerification || dismissed) return null

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 mb-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 rounded-full bg-amber-100 p-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-base font-medium text-black mb-1">
              E-posta Adresinizi Doğrulayın
            </h3>
            <p className="text-sm text-gray-700 font-light leading-relaxed">
              Hesabınızın güvenliği için e-posta adresinizi doğrulamanız gerekmektedir. 
              Kayıt sırasında verdiğiniz e-posta adresine doğrulama maili gönderdik. 
              Lütfen e-posta kutunuzu kontrol edin ve gönderilen bağlantıya tıklayarak 
              hesabınızı doğrulayın.
            </p>
            <p className="text-xs text-gray-600 font-light mt-2">
              E-postayı bulamadınız mı? Spam klasörünüzü kontrol etmeyi unutmayın.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSendVerification} 
              disabled={sending}
              className="bg-black text-white hover:bg-black/90 h-10 px-6 rounded-full text-sm font-light"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gönderiliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Doğrulama E-postası Gönder
                </span>
              )}
            </Button>
          </div>
        </div>

        <button 
          onClick={() => setDismissed(true)} 
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
