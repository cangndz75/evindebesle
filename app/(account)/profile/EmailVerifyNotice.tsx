'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function EmailVerifyNotice() {
  const [needsVerification, setNeedsVerification] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch("/api/user/me").then(res => res.json()).then(data => {
      setNeedsVerification(!data.emailVerified)
    })
  }, [])

  const handleSendVerification = async () => {
    setSending(true)
    const res = await fetch("/api/user/send-verification", { method: "POST" })
    setSending(false)

    if (res.ok) toast.success("Doğrulama e-postası gönderildi.")
    else toast.error("Bir hata oluştu.")
  }

  if (!needsVerification) return null

  return (
    <div className="bg-gray-100 border px-4 py-3 rounded-md mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">E-posta Adresinizi Doğrulayın</h4>
          <p className="text-sm text-gray-600 mt-1">
            Kayıt sırasında verdiğiniz e-posta adresine doğrulama maili gönderdik.
            Lütfen hesabınızı onaylayın.
          </p>
        </div>
        <button onClick={() => setNeedsVerification(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <Button onClick={handleSendVerification} disabled={sending} className="mt-3">
        {sending ? "Gönderiliyor..." : "E-posta Adresinizi Doğrulayın"}
      </Button>
    </div>
  )
}
