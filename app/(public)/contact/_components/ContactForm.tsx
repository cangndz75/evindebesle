"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  return (
    <div className="bg-white p-8 shadow-xl rounded-lg w-full max-w-2xl">
      <p className="text-sm text-primary font-semibold uppercase mb-1 tracking-wide">SORULARINIZ MI VAR?</p>
      <h2 className="text-3xl font-bold text-black mb-6">Bize Ulaşın</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Ad Soyad"
          className="border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Telefon"
          className="border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <Input
        placeholder="E-posta *"
        className="mt-6 border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <Textarea
        placeholder="Mesajınız *"
        className="mt-6 border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black resize-none"
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />

      <Button className="mt-8 w-full bg-primary hover:bg-primary/90 text-white rounded-md">
        <i className="fas fa-paper-plane mr-2" />
        İletişime Geç
      </Button>
    </div>
  )
}
