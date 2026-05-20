"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Link from "next/link";
import TipTapEditor from "@/components/admin/blog/TipTapEditor";
import { processHtmlImages } from "@/lib/cloudinary";

export default function NewBlogPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        coverImage: "",
        category: "",
        tags: "",
        isPublished: false,
        metaTitle: "",
        metaDescription: "",
    });


    const handleSubmit = async (publish: boolean) => {
        if (!formData.title || !formData.content) {
            toast.error("Başlık ve içerik gereklidir.");
            return;
        }

        setLoading(true);
        try {
            const processedContent = await processHtmlImages(formData.content);
            const res = await fetch("/api/admin/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    content: processedContent,
                    isPublished: publish,
                    tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t),
                }),
            });

            if (res.ok) {
                toast.success(publish ? "Yazı yayınlandı" : "Taslak kaydedildi");
                router.push("/admin-blog");
            } else {
                const error = await res.json();
                throw new Error(error.error || "Bir hata oluştu");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page mx-auto max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin-blog">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Yeni Blog Yazısı</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>İçerik</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Başlık</Label>
                                <Input
                                    id="title"
                                    placeholder="Yazı başlığı..."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Özet (Opsiyonel)</Label>
                                <Textarea
                                    id="excerpt"
                                    placeholder="Kısa bir özet..."
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">İçerik</Label>
                                <TipTapEditor
                                    content={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Ayarları</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">SEO Başlığı</Label>
                                <Input
                                    id="metaTitle"
                                    placeholder="Google'da görünecek başlık..."
                                    value={formData.metaTitle}
                                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metaDescription">SEO Açıklaması</Label>
                                <Textarea
                                    id="metaDescription"
                                    placeholder="Google'da görünecek açıklama..."
                                    value={formData.metaDescription}
                                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yayınlama</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isPublished">Taslak olarak kaydet</Label>
                                <Switch
                                    id="isPublished"
                                    checked={!formData.isPublished}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: !checked })}
                                />
                            </div>
                            <div className="pt-4 space-y-2">
                                <Button
                                    className="w-full flex gap-2"
                                    onClick={() => handleSubmit(true)}
                                    disabled={loading}
                                >
                                    <Send className="w-4 h-4" /> Yayınla
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full flex gap-2"
                                    onClick={() => handleSubmit(false)}
                                    disabled={loading}
                                >
                                    <Save className="w-4 h-4" /> Taslak Kaydet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Görsel & Etiketler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="coverImage">Kapak Görseli URL</Label>
                                <Input
                                    id="coverImage"
                                    placeholder="https://..."
                                    value={formData.coverImage}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Input
                                    id="category"
                                    placeholder="Örn: Stil Önerileri"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags">Etiketler (Virgülle ayırın)</Label>
                                <Input
                                    id="tags"
                                    placeholder="stil, kombin, sezon..."
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
