-- CreateTable
CREATE TABLE "WelcomePopupSettings" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "delayMs" INTEGER NOT NULL DEFAULT 3000,
    "title" TEXT NOT NULL DEFAULT 'İlk Siparişine Özel Sürpriz İndirimin Var! 🎁',
    "description" TEXT NOT NULL DEFAULT 'E-posta adresini bırak, sadece sana özel tanımlanacak indirimi keşfet.',
    "emailPlaceholder" TEXT NOT NULL DEFAULT 'E-posta adresiniz *',
    "consentText" TEXT NOT NULL DEFAULT 'Kullanım Koşullarını ve Gizlilik Politikasını okuduğumu ve kabul ettiğimi onaylıyorum.',
    "buttonText" TEXT NOT NULL DEFAULT 'Sürprizi Gör ✨',
    "imageUrl" TEXT,
    "showEmailForm" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelcomePopupSettings_pkey" PRIMARY KEY ("id")
);
