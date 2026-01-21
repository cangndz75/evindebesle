'use client'

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function MarketingConsentToggle() {
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/me").then(res => res.json()).then(data => {
      setConsent(data.marketingEmailConsent)
      setLoading(false)
    })
  }, [])

  const handleChange = async (val: boolean) => {
    setConsent(val)
    const res = await fetch("/api/user/update-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: val }),
    })

    if (res.ok) toast.success("Tercihiniz güncellendi.")
    else toast.error("Bir hata oluştu.")
  }

  if (loading) return null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-medium text-black mb-1">
            Kampanya ve Fırsat Bildirimleri
          </h3>
          <p className="text-xs text-gray-600 font-light leading-relaxed">
            Özel indirimler, yeni ürünler ve kampanyalardan haberdar olmak için 
            e-posta bildirimlerini açabilirsiniz. İstediğiniz zaman kapatabilirsiniz.
          </p>
        </div>
        <Switch 
          checked={consent} 
          onCheckedChange={handleChange}
          className="shrink-0"
        />
      </div>
    </div>
  )
}
