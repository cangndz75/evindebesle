"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MfaStatus = {
  enabled: boolean;
  enabledAt: string | null;
  backupCodesRemaining: number;
};

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [otp, setOtp] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupUri, setSetupUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    const res = await fetch("/api/admin/mfa/status", { cache: "no-store" });
    if (!res.ok) {
      toast.error("MFA durumu alınamadı");
      return;
    }
    const data = (await res.json()) as MfaStatus;
    setStatus(data);
  };

  useEffect(() => {
    loadStatus().catch(() => {
      toast.error("MFA durumu alınamadı");
    });
  }, []);

  const setupMfa = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "MFA setup başarısız");
        return;
      }

      setSetupSecret(data.secret || "");
      setSetupUri(data.otpauthUri || "");
      toast.success("MFA secret oluşturuldu. Authenticator uygulamasına ekleyin.");
      await loadStatus();
    } finally {
      setLoading(false);
    }
  };

  const enableMfa = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "MFA aktifleştirilemedi");
        return;
      }

      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setOtp("");
      toast.success("MFA aktif edildi.");
      await loadStatus();
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mfa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "MFA kapatılamadı");
        return;
      }

      setSetupSecret("");
      setSetupUri("");
      setBackupCodes([]);
      toast.success("MFA devre dışı bırakıldı.");
      await loadStatus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Security</h1>
      <p className="text-sm text-gray-600">
        Admin hesapları için MFA burada yönetilir. MFA açık olduğunda girişte şifreye ek olarak kod zorunludur.
      </p>

      <div className="rounded border p-4 space-y-2 bg-white">
        <div className="text-sm">
          Durum: <span className="font-medium">{status?.enabled ? "Aktif" : "Pasif"}</span>
        </div>
        <div className="text-sm">
          Yedek Kod Sayısı: <span className="font-medium">{status?.backupCodesRemaining ?? 0}</span>
        </div>
      </div>

      <div className="rounded border p-4 space-y-3 bg-white">
        <h2 className="font-medium">1) Setup</h2>
        <Button onClick={setupMfa} disabled={loading}>MFA Secret Oluştur</Button>

        {setupSecret ? (
          <div className="text-xs break-all bg-gray-50 p-3 rounded border">
            Secret: {setupSecret}
          </div>
        ) : null}

        {setupUri ? (
          <div className="text-xs break-all bg-gray-50 p-3 rounded border">
            OTPAuth URI: {setupUri}
          </div>
        ) : null}
      </div>

      <div className="rounded border p-4 space-y-3 bg-white">
        <h2 className="font-medium">2) Enable</h2>
        <Input
          placeholder="Authenticator kodu"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ""))}
        />
        <Button onClick={enableMfa} disabled={loading || otp.length < 6}>MFA Aktifleştir</Button>
      </div>

      {backupCodes.length > 0 ? (
        <div className="rounded border p-4 space-y-2 bg-white">
          <h2 className="font-medium">Yedek Kodlar</h2>
          <p className="text-xs text-red-600">Bu kodlar yalnızca bir kez gösterilir. Güvenli bir yerde saklayın.</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {backupCodes.map((code) => (
              <div key={code} className="rounded border bg-gray-50 p-2 font-mono">{code}</div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded border p-4 space-y-3 bg-white">
        <h2 className="font-medium">3) Disable</h2>
        <Button variant="destructive" onClick={disableMfa} disabled={loading || !status?.enabled}>
          MFA Kapat
        </Button>
      </div>
    </div>
  );
}
