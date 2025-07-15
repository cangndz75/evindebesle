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
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      <span className="text-sm text-gray-700">Kampanya ve fırsat e-postalarını almak istiyorum</span>
      <Switch checked={consent} onCheckedChange={handleChange} />
    </div>
  )
}
