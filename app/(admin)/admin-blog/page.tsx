"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/admin/blog");
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            toast.error("Yazılar yüklenirken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Yazı silindi");
                setPosts(posts.filter((p) => p.id !== id));
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error("Silme işlemi başarısız");
        }
    };

    const filteredPosts = posts.filter((post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Yazıları</h1>
                    <p className="text-muted-foreground">İçeriklerinizi buradan yönetin.</p>
                </div>
                <Link href="/admin-blog/new">
                    <Button className="flex gap-2">
                        <Plus className="w-4 h-4" /> Yeni Yazı Ekle
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Bütün Yazılar</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Yazı ara..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Yükleniyor...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Başlık</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Yazar</TableHead>
                                    <TableHead>Yayınlanma Tarihi</TableHead>
                                    <TableHead className="text-right">Aksiyonlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPosts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={post.isPublished ? "default" : "secondary"}>
                                                {post.isPublished ? "Yayında" : "Taslak"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{post.author?.name}</TableCell>
                                        <TableCell>
                                            {post.publishedAt
                                                ? new Date(post.publishedAt).toLocaleDateString("tr-TR")
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <Link href={`/blog/${post.slug}`} target="_blank">
                                                <Button variant="ghost" size="icon" title="Görüntüle">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin-blog/${post.id}`}>
                                                <Button variant="ghost" size="icon" title="Düzenle">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(post.id)}
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
