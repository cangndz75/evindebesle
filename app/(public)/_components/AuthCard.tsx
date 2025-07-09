'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function AuthCard({ type, onFlip }: { type: 'login' | 'reset', onFlip: () => void }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="bg-white shadow-xl rounded-xl p-8 w-full h-full flex flex-col justify-center gap-4">
      <h2 className="text-2xl font-bold text-center">
        {type === 'login' ? 'Giriş Yap' : 'Şifre Yenile'}
      </h2>
      <p className="text-center text-muted-foreground text-sm">
        {type === 'login' ? 'Tekrar hoş geldiniz!' : 'Email adresinizi girin, size bağlantı gönderelim.'}
      </p>

      <form className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md bg-background border-input"
        />
        {type === 'login' && (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifre"
              className="w-full px-4 py-2 border rounded-md bg-background border-input"
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-sm text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Gizle' : 'Göster'}
            </button>
          </div>
        )}

        <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white">
          {type === 'login' ? 'Giriş Yap' : 'Bağlantı Gönder'}
        </Button>
      </form>

      <button
        onClick={onFlip}
        type="button"
        className="text-sm text-violet-600 underline text-center mt-2"
      >
        {type === 'login' ? 'Şifremi unuttum' : 'Giriş ekranına dön'}
      </button>
    </div>
  )
}
