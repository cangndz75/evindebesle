"use client";

import { useState } from "react";
import { Save, Copy, History, Undo, Redo, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignDraft, CampaignStatus } from "../types";
import { toast } from "sonner";

interface CampaignMetaBarProps {
  draft: CampaignDraft;
  onUpdate: (updates: Partial<CampaignDraft>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const statusColors: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  ready: "bg-blue-100 text-blue-700 border-blue-300",
  scheduled: "bg-yellow-100 text-yellow-700 border-yellow-300",
  sent: "bg-green-100 text-green-700 border-green-300",
};

const statusLabels: Record<CampaignStatus, string> = {
  draft: "Taslak",
  ready: "Hazır",
  scheduled: "Zamanlandı",
  sent: "Gönderildi",
};

export default function CampaignMetaBar({
  draft,
  onUpdate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CampaignMetaBarProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/campaigns", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) throw new Error("Kayıt başarısız");

      const data = await response.json();
      onUpdate({ id: data.id });
      toast.success("Kampanya kaydedildi");
    } catch (error) {
      toast.error("Kayıt sırasında bir hata oluştu");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    toast.success("Kampanya kopyalandı");
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-8 py-5 space-y-4">
        
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Kampanya adı..."
                value={draft.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="text-lg font-semibold border-0 focus-visible:ring-0 px-0 bg-transparent"
              />
            </div>
            <Select
              value={draft.status}
              onValueChange={(value: CampaignStatus) => onUpdate({ status: value })}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="ready">Hazır</SelectItem>
                <SelectItem value="scheduled">Zamanlandı</SelectItem>
                <SelectItem value="sent">Gönderildi</SelectItem>
              </SelectContent>
            </Select>
            <Badge
              variant="outline"
              className={statusColors[draft.status]}
            >
              {statusLabels[draft.status]}
            </Badge>
          </div>

          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              title="Geri al"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              title="İleri al"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              title="Kopyala"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Versiyonlar"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>

        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Subject</label>
            <Input
              placeholder="E-posta konusu..."
              value={draft.subject}
              onChange={(e) => onUpdate({ subject: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="col-span-3">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Preheader</label>
            <Input
              placeholder="Önizleme metni..."
              value={draft.preheader}
              onChange={(e) => onUpdate({ preheader: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">From Name</label>
            <Input
              placeholder="Gönderen adı"
              value={draft.fromName}
              onChange={(e) => onUpdate({ fromName: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">From Email</label>
            <Input
              placeholder="email@example.com"
              value={draft.fromEmail}
              onChange={(e) => onUpdate({ fromEmail: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Reply-To</label>
            <Input
              placeholder="reply@example.com"
              value={draft.replyTo}
              onChange={(e) => onUpdate({ replyTo: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
