"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  Send,
  Mail,
  Blocks,
  Eye,
  Undo,
  Redo,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import BlockEditor from "./BlockEditor";
import HtmlEditor from "./HtmlEditor";
import PreviewPane from "./PreviewPane";
import BlockInspector from "./BlockInspector";
import { CampaignDraft, Block } from "../types";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Bilgiler", icon: Mail },
  { id: 2, label: "İçerik", icon: Blocks },
  { id: 3, label: "Gönder", icon: Send },
] as const;

const initialDraft: CampaignDraft = {
  id: null,
  name: "",
  status: "draft",
  subject: "",
  preheader: "",
  fromName: "Dark Velvet",
  fromEmail: "info@dark-velvet.com",
  replyTo: "info@dark-velvet.com",
  blocks: [],
  audienceSegmentId: null,
  scheduleAt: null,
};

export default function CampaignComposerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CampaignDraft>(initialDraft);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<string>("default");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [history, setHistory] = useState<CampaignDraft[]>([initialDraft]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editorMode, setEditorMode] = useState<"blocks" | "html">("blocks");

  useEffect(() => {
    const savedDraft = localStorage.getItem("abandonedCartDraft");
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setDraft(parsedDraft);
        setHistory([parsedDraft]);
        setHistoryIndex(0);
        localStorage.removeItem("abandonedCartDraft");
        if (parsedDraft.subject && parsedDraft.blocks?.length > 0) {
          setStep(2);
        }
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  const updateDraft = useCallback((updates: Partial<CampaignDraft>) => {
    setDraft((prev) => {
      const newDraft = { ...prev, ...updates };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
  }, [history, historyIndex]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setDraft((prev) => {
      const newBlocks = prev.blocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      );
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
  }, [history, historyIndex]);

  const addBlock = useCallback((blockType: Block["type"]) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: blockType,
      content: {},
      style: {},
      visibility: { mobile: true, desktop: true },
    };
    setDraft((prev) => {
      const newBlocks = [...prev.blocks, newBlock];
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
    setSelectedBlockId(newBlock.id);
  }, [history, historyIndex]);

  const removeBlock = useCallback((blockId: string) => {
    setDraft((prev) => {
      const newBlocks = prev.blocks.filter((block) => block.id !== blockId);
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }, [history, historyIndex, selectedBlockId]);

  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    setDraft((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      const newBlocks = [...prev.blocks];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prev;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDraft(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDraft(history[newIndex]);
    }
  }, [history, historyIndex]);

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
      updateDraft({ id: data.id });
      toast.success("Kampanya kaydedildi");
    } catch {
      toast.error("Kayıt sırasında bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
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
    } catch {
      toast.error("Test gönderimi sırasında bir hata oluştu");
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
      updateDraft({ status: "sent" });
      toast.success("Kampanya gönderildi!");
      setShowSendModal(false);
    } catch {
      toast.error("Gönderim sırasında bir hata oluştu");
    } finally {
      setIsSending(false);
    }
  };

  const validateStep1 = () => {
    if (!draft.subject.trim()) {
      toast.error("E-posta konusu zorunludur");
      return false;
    }
    return true;
  };

  const validateForSend = () => {
    const errors: string[] = [];
    if (!draft.subject) errors.push("Subject boş olamaz");
    if (!draft.id) errors.push("Kampanya henüz kaydedilmemiş. Lütfen kaydedin.");
    if (!draft.blocks.some((b) => b.type === "footer")) errors.push("Footer bloğu zorunludur");
    if (!draft.blocks.some((b) => b.type === "footer" && b.content.siteLink)) errors.push("Unsubscribe linki eklenmelidir");
    return errors;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const selectedBlock = draft.blocks.find((b) => b.id === selectedBlockId) || null;
  const validationErrors = validateForSend();
  const canSend = validationErrors.length === 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <Input
                placeholder="Kampanya adı..."
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="text-base font-semibold border-0 focus-visible:ring-0 px-0 bg-transparent h-8"
              />
            </div>
            <Badge
              variant="outline"
              className={
                draft.status === "sent"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }
            >
              {draft.status === "draft" ? "Taslak" : draft.status === "sent" ? "Gönderildi" : draft.status === "scheduled" ? "Zamanlandı" : "Hazır"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <>
                <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex === 0} title="Geri al">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="İleri al">
                  <Redo className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-gray-200" />
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                {i > 0 && (
                  <div className={`w-12 h-px mx-1 ${isDone ? "bg-emerald-400" : "bg-gray-200"}`} />
                )}
                <button
                  onClick={() => {
                    if (s.id < step || (s.id === 2 && step === 1 && validateStep1()) || s.id <= step) {
                      setStep(s.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : isDone
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                  {s.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {step === 1 && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Kampanya Bilgileri</h2>
                <p className="text-gray-500 mt-1">E-postanızın temel bilgilerini girin.</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-posta Konusu *</Label>
                  <Input
                    placeholder="Sepetinizde ürün unuttunuz!"
                    value={draft.subject}
                    onChange={(e) => updateDraft({ subject: e.target.value })}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-400">Gelen kutusunda görünen ana başlık</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Önizleme Metni</Label>
                  <Input
                    placeholder="Beğendiğiniz ürünler sizi bekliyor..."
                    value={draft.preheader}
                    onChange={(e) => updateDraft({ preheader: e.target.value })}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-400">Konu satırının yanında görünen kısa metin</p>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <p className="text-sm font-medium text-gray-700 mb-4">Gönderen Bilgileri</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Gönderen Adı</Label>
                      <Input
                        value={draft.fromName}
                        onChange={(e) => updateDraft({ fromName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Gönderen E-posta</Label>
                      <Input
                        value={draft.fromEmail}
                        onChange={(e) => updateDraft({ fromEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inbox Preview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Gelen Kutusu Önizleme</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {draft.fromName?.[0]?.toUpperCase() || "D"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900">{draft.fromName || "Dark Velvet"}</span>
                        <span className="text-xs text-gray-400">Şimdi</span>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate">{draft.subject || "Subject ekleyin"}</p>
                      <p className="text-xs text-gray-400 truncate">{draft.preheader || "Preheader ekleyin"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={goNext} className="bg-gray-900 hover:bg-gray-800 px-8">
                  Devam Et
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex h-full" style={{ minHeight: 0 }}>
            {/* Editor */}
            <div className="flex-1 flex flex-col border-r border-gray-200 bg-white" style={{ minWidth: 0 }}>
              <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4">
                <button
                  onClick={() => setEditorMode("blocks")}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    editorMode === "blocks"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Blocks className="w-4 h-4" />
                  Blok Editör
                </button>
                <button
                  onClick={() => setEditorMode("html")}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    editorMode === "html"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  HTML
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {editorMode === "blocks" ? (
                  <BlockEditor
                    draft={draft}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onAddBlock={addBlock}
                    onUpdateBlock={updateBlock}
                    onRemoveBlock={removeBlock}
                    onMoveBlock={moveBlock}
                    selectedBlock={selectedBlock}
                  />
                ) : (
                  <HtmlEditor draft={draft} onUpdate={() => {}} />
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-[340px] border-l border-gray-200 bg-gray-50 overflow-y-auto shrink-0">
              {selectedBlock ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Blok Ayarları</h3>
                    <button
                      onClick={() => setSelectedBlockId(null)}
                      className="text-xs text-gray-500 hover:text-gray-800"
                    >
                      Kapat
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1">
                    <BlockInspector
                      block={selectedBlock}
                      onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                    />
                  </div>
                </div>
              ) : (
                <PreviewPane
                  draft={draft}
                  previewUser={previewUser}
                  deviceView={deviceView}
                  onPreviewUserChange={setPreviewUser}
                  onDeviceViewChange={setDeviceView}
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gönderim Ayarları</h2>
                <p className="text-gray-500 mt-1">Alıcıları seçin ve gönderin.</p>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Kampanya Özeti</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Konu:</span>
                    <p className="font-medium mt-0.5">{draft.subject || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gönderen:</span>
                    <p className="font-medium mt-0.5">{draft.fromName} &lt;{draft.fromEmail}&gt;</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Blok Sayısı:</span>
                    <p className="font-medium mt-0.5">{draft.blocks.length} blok</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Durum:</span>
                    <p className="font-medium mt-0.5">{draft.id ? "Kaydedildi" : "Henüz kaydedilmedi"}</p>
                  </div>
                </div>
              </div>

              {/* Test Send */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Test Gönderimi</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    type="email"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleTestSend} disabled={!testEmail}>
                    Test Gönder
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Göndermeden önce test edin</p>
              </div>

              {/* Audience */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <p className="text-sm font-medium text-gray-700">Alıcılar</p>
                {draft.recipientEmail ? (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{draft.recipientEmail}</p>
                      <p className="text-xs text-gray-400">Tek alıcı</p>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={draft.audienceSegmentId || ""}
                    onValueChange={(value) => updateDraft({ audienceSegmentId: value || null })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Segment seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">Bülten Aboneleri</SelectItem>
                      <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                      <SelectItem value="active">Aktif Kullanıcılar</SelectItem>
                      <SelectItem value="inactive">Pasif Kullanıcılar</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Zamanlama</p>
                  <Select
                    value={draft.scheduleAt ? "scheduled" : "now"}
                    onValueChange={(value) => {
                      if (value === "now") {
                        updateDraft({ scheduleAt: null });
                      } else {
                        updateDraft({ scheduleAt: new Date() });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Hemen Gönder</SelectItem>
                      <SelectItem value="scheduled">Zamanla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Validation */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                  <p className="font-semibold mb-2">Gönderim için düzeltilmesi gerekenler:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  İçeriğe Dön
                </Button>
                <Button
                  onClick={() => setShowSendModal(true)}
                  disabled={!canSend}
                  className="bg-emerald-600 hover:bg-emerald-700 px-8"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Gönder
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav for step 2 */}
      {step === 2 && (
        <div className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
          <Button variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Bilgilere Dön
          </Button>
          <div className="text-xs text-gray-400">
            {draft.blocks.length} blok eklendi
          </div>
          <Button size="sm" onClick={goNext} className="bg-gray-900 hover:bg-gray-800">
            Gönderim Ayarları
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}

      {/* Send Confirmation Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampanyayı Gönder</DialogTitle>
            <DialogDescription>Bu işlem geri alınamaz. Lütfen kontrol edin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Kampanya:</span>
                <span className="font-medium">{draft.name || "İsimsiz"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Konu:</span>
                <span className="font-medium">{draft.subject || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Alıcı:</span>
                <span className="font-medium">{draft.recipientEmail || "Segment"}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-send"
                checked={sendConfirmed}
                onCheckedChange={(checked) => setSendConfirmed(checked as boolean)}
              />
              <label htmlFor="confirm-send" className="text-sm font-medium">
                Eminim, kampanyayı gönder
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSend}
              disabled={!sendConfirmed || isSending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
