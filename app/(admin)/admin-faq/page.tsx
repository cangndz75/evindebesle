"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    ArrowLeft,
    RefreshCw,
    GripVertical,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    isActive: boolean;
}

const categories = [
    { value: "order", label: "Sipariş" },
    { value: "payment", label: "Ödeme" },
    { value: "shipping", label: "Kargo" },
    { value: "return", label: "İade" },
    { value: "product", label: "Ürün" },
    { value: "account", label: "Hesap" },
];

export default function AdminFAQPage() {
    const router = useRouter();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        question: "",
        answer: "",
        category: "order",
        order: 0,
        isActive: true,
    });

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/faq?admin=true");
            if (res.ok) {
                const data = await res.json();
                setFaqs(data.faqs || []);
            }
        } catch (error) {
            toast.error("SSS yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleSave = async () => {
        if (!form.question || !form.answer) {
            toast.error("Soru ve cevap zorunlu");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/faq", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
            });

            if (res.ok) {
                toast.success(editingId ? "SSS güncellendi" : "SSS eklendi");
                fetchFaqs();
                resetForm();
            } else {
                toast.error("Kayıt başarısız");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setFaqToDelete(id);
        setConfirmDeleteOpen(true);
    };

    const performDelete = async () => {
        if (!faqToDelete) return;

        try {
            const res = await fetch(`/api/admin/faq?id=${faqToDelete}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("SSS silindi");
                fetchFaqs();
            }
        } catch (error) {
            toast.error("Silme başarısız");
        }
    };

    const handleEdit = (faq: FAQ) => {
        setForm({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            order: faq.order,
            isActive: faq.isActive,
        });
        setEditingId(faq.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({ question: "", answer: "", category: "order", order: 0, isActive: true });
        setEditingId(null);
        setShowForm(false);
    };

    const toggleActive = async (faq: FAQ) => {
        try {
            const res = await fetch("/api/admin/faq", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
            });
            if (res.ok) {
                fetchFaqs();
            }
        } catch (error) {
            toast.error("Güncelleme başarısız");
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">SSS Yönetimi</h1>
                        <p className="text-sm text-gray-500">Sıkça Sorulan Soruları yönetin</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchFaqs}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yenile
                    </Button>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni SSS
                    </Button>
                </div>
            </div>

            
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? "SSS Düzenle" : "Yeni SSS"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Kategori</label>
                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Soru</label>
                            <Input
                                value={form.question}
                                onChange={(e) => setForm({ ...form, question: e.target.value })}
                                placeholder="Soru yazın..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Cevap (HTML destekli)</label>
                            <Textarea
                                value={form.answer}
                                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                placeholder="Cevap yazın..."
                                rows={5}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="text-sm font-medium">Sıra</label>
                                <Input
                                    type="number"
                                    value={form.order}
                                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                    className="w-24"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={form.isActive}
                                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                                />
                                <label className="text-sm">Aktif</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={resetForm}>
                                <X className="w-4 h-4 mr-2" />
                                İptal
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Kaydet
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            
            <Card>
                <CardHeader>
                    <CardTitle>SSS Listesi ({faqs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {faqs.map((faq) => (
                                <div
                                    key={faq.id}
                                    className={`flex items-center gap-4 p-4 rounded-lg border ${faq.isActive ? "bg-white" : "bg-gray-100 opacity-60"
                                        }`}
                                >
                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                    <Badge variant="outline">
                                        {categories.find((c) => c.value === faq.category)?.label || faq.category}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{faq.question}</p>
                                        <p className="text-sm text-gray-500 truncate">{faq.answer.substring(0, 100)}...</p>
                                    </div>
                                    <Switch checked={faq.isActive} onCheckedChange={() => toggleActive(faq)} />
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            {faqs.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    Henüz SSS eklenmemiş
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                onConfirm={performDelete}
                title="Soru Sil"
                description="Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
            />
        </div>
    );
}
