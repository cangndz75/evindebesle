"use client";

import { useState } from "react";
import { Send, Mail, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CampaignDraft } from "../types";
import { toast } from "sonner";

interface SendBarProps {
  draft: CampaignDraft;
  onUpdate: (updates: Partial<CampaignDraft>) => void;
}

export default function SendBar({ draft, onUpdate }: SendBarProps) {
  const [testEmail, setTestEmail] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const validateDraft = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!draft.subject) {
      errors.push("Subject boş olamaz");
    }

    if (!draft.id) {
      errors.push("Kampanya henüz kaydedilmemiş. Lütfen gönderimden önce kaydedin.");
    }

    if (!draft.blocks.some((b) => b.type === "footer")) {
      errors.push("Footer bloğu zorunludur (unsubscribe linki için)");
    }

    const hasUnsubscribe = draft.blocks.some(
      (b) => b.type === "footer" && b.content.siteLink
    );
    if (!hasUnsubscribe) {
      errors.push("Unsubscribe linki eklenmelidir");
    }



    const hasCoupon = draft.blocks.some((b) => b.type === "coupon");
    if (hasCoupon) {
      const couponBlock = draft.blocks.find((b) => b.type === "coupon");
      if (couponBlock && !couponBlock.content.couponCode?.includes("coupon_code")) {
        errors.push("Kupon bloğu varsa coupon_code değişkeni kullanılmalıdır");
      }
    }

    return { errors, warnings };
  };

  const handleTestSend = async () => {
    if (!testEmail) {
      toast.error("Test e-postası girin");
      return;
    }

    try {
      const response = await fetch("/api/admin/campaigns/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: draft.id,
          email: testEmail,
          blocks: draft.blocks,
          subject: draft.subject,
          fromName: draft.fromName,
          fromEmail: draft.fromEmail,
          replyTo: draft.replyTo,
        }),
      });

      if (!response.ok) throw new Error("Test gönderimi başarısız");

      toast.success("Test e-postası gönderildi");
      setTestEmail("");
    } catch (error) {
      toast.error("Test gönderimi sırasında bir hata oluştu");
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!sendConfirmed) {
      toast.error("Lütfen onay kutusunu işaretleyin");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) throw new Error("Gönderim başarısız");

      onUpdate({ status: "sent" });
      toast.success("Kampanya gönderildi");
      setShowSendModal(false);
    } catch (error) {
      toast.error("Gönderim sırasında bir hata oluştu");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const validation = validateDraft();
  const canSend = validation.errors.length === 0;

  return (
    <>
      <div className="border-t border-gray-200 bg-white">
        <div className="px-8 py-5 space-y-4">
          {/* Üst Satır: Test, Segment, Zamanlama, Gönder */}
          <div className="flex items-center justify-between gap-6">
            {/* Sol: Test Gönder */}
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Test e-postası..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-72"
                  type="email"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSend}
                  disabled={!testEmail}
                >
                  Test Gönder
                </Button>
              </div>
            </div>

            {/* Orta: Segment veya Alıcı ve Zamanlama */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                {draft.recipientEmail ? (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Alıcı</span>
                    <span className="text-sm font-medium">{draft.recipientEmail}</span>
                  </div>
                ) : (
                  <Select
                    value={draft.audienceSegmentId || ""}
                    onValueChange={(value) =>
                      onUpdate({ audienceSegmentId: value || null })
                    }
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Segment seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">Bülten Aboneleri</SelectItem>
                      <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                      <SelectItem value="active">Aktif Kullanıcılar</SelectItem>
                      <SelectItem value="inactive">Pasif Kullanıcılar</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <Select
                  value={draft.scheduleAt ? "scheduled" : "now"}
                  onValueChange={(value) => {
                    if (value === "now") {
                      onUpdate({ scheduleAt: null });
                    } else {
                      // Zamanlama UI'ı buraya eklenebilir
                      onUpdate({ scheduleAt: new Date() });
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Hemen</SelectItem>
                    <SelectItem value="scheduled">Planla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sağ: Gönder Butonu */}
            <div>
              <Button
                onClick={() => setShowSendModal(true)}
                disabled={!canSend}
                className="bg-blue-600 hover:bg-blue-700 px-6"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                Gönder
              </Button>
            </div>
          </div>

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <strong className="font-semibold">Uyarılar:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <strong className="font-semibold">Hatalar:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Send Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampanyayı Gönder</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Lütfen gönderim özetini kontrol edin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <strong>Alıcı:</strong> {draft.recipientEmail ? draft.recipientEmail : "Hesaplanıyor..."}
            </div>
            <div>
              <strong>Kampanya:</strong> {draft.name || "İsimsiz"}
            </div>
            <div>
              <strong>Subject:</strong> {draft.subject || "Subject yok"}
            </div>

            {validation.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Uyarılar:</strong>
                <ul className="list-disc list-inside mt-1">
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm"
                checked={sendConfirmed}
                onCheckedChange={(checked) => setSendConfirmed(checked as boolean)}
              />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Eminim, gönder
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendModal(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleSend}
              disabled={!sendConfirmed || isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
