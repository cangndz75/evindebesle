'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function PasswordChange() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async () => {
    if (next !== confirm) {
      toast.error("Yeni şifreler uyuşmuyor.")
      return
    }

    setSaving(true)
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    })
    setSaving(false)

    if (res.ok) toast.success("Şifreniz güncellendi.")
    else toast.error("Şifre güncellenemedi.")
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Mevcut Şifre</label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Yeni Şifre</label>
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Yeni Şifre (Tekrar)</label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <Button onClick={handleChangePassword} disabled={saving}>
        {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </Button>
    </div>
  )
}
