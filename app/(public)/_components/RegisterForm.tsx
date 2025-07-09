'use client';

import { useState } from 'react';
import AuthHeader from './AuthHeader';

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md space-y-6">
      <AuthHeader title="Kayıt Ol" subtitle="Hesap oluştur, hayvan dostlarını koru!" />

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Ad Soyad"
          className="w-full px-4 py-2 border rounded-md bg-background border-input"
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md bg-background border-input"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Şifre"
            className="w-full px-4 py-2 border rounded-md bg-background border-input"
          />
          <button
            type="button"
            className="absolute right-3 top-2 text-sm text-muted-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? 'Gizle' : 'Göster'}
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md bg-lime-500 hover:bg-lime-600 transition text-white font-semibold"
        >
          Kayıt Ol
        </button>
      </form>
    </div>
  );
}
