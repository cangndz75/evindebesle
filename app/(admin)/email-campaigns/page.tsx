"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Mail,
    Plus,
    Edit2,
    Trash2,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    ArrowLeft,
    Eye,
    Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Campaign {
    id: string;
    name: string;
    status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
    subject: string | null;
    fromName: string | null;
    fromEmail: string | null;
    scheduleAt: string | null;
    sentAt: string | null;
    sentCount: number;
    createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT: { label: "Taslak", color: "bg-gray-100 text-gray-700", icon: <Edit2 className="w-3 h-3" /> },
    SCHEDULED: { label: "Zamanlandı", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-3 h-3" /> },
    SENDING: { label: "Gönderiliyor", color: "bg-yellow-100 text-yellow-700", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    SENT: { label: "Gönderildi", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
    CANCELLED: { label: "İptal", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
};

export default function CampaignsListPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/campaigns");
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Kampanyalar yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/campaigns/${deleteId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Kampanya silindi");
                fetchCampaigns();
            } else {
                toast.error("Kampanya silinemedi");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/campaigns/${id}/duplicate`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Kampanya kopyalandı");
                fetchCampaigns();
            } else {
                toast.error("Kampanya kopyalanamadı");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        }
    };

    const handleSendNow = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/campaigns/${id}/send`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Kampanya gönderim kuyruğuna eklendi");
                fetchCampaigns();
            } else {
                toast.error("Kampanya gönderilemedi");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="admin-page space-y-6">
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">E-posta Kampanyaları</h1>
                        <p className="text-sm text-gray-500">Kayıtlı kampanyaları yönetin</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchCampaigns}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yenile
                    </Button>
                    <Button onClick={() => router.push("/campaigns")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Kampanya
                    </Button>
                </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Toplam</p>
                                <p className="text-2xl font-bold">{campaigns.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Taslak</p>
                                <p className="text-2xl font-bold">
                                    {campaigns.filter(c => c.status === "DRAFT").length}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Edit2 className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Zamanlanmış</p>
                                <p className="text-2xl font-bold">
                                    {campaigns.filter(c => c.status === "SCHEDULED").length}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Gönderildi</p>
                                <p className="text-2xl font-bold">
                                    {campaigns.filter(c => c.status === "SENT").length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            
            <Card>
                <CardHeader>
                    <CardTitle>Kampanya Listesi</CardTitle>
                    <CardDescription>Tüm e-posta kampanyalarınız</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kampanya</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Konu</TableHead>
                                <TableHead>Gönderim Tarihi</TableHead>
                                <TableHead>Gönderildi</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => {
                                const status = statusConfig[campaign.status] || statusConfig.DRAFT;
                                return (
                                    <TableRow key={campaign.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900">{campaign.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(campaign.createdAt), "d MMM yyyy", { locale: tr })}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                                                {status.icon}
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                                                {campaign.subject || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {campaign.scheduleAt ? (
                                                <span className="text-sm">
                                                    {format(new Date(campaign.scheduleAt), "d MMM HH:mm", { locale: tr })}
                                                </span>
                                            ) : campaign.sentAt ? (
                                                <span className="text-sm text-green-600">
                                                    {format(new Date(campaign.sentAt), "d MMM HH:mm", { locale: tr })}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">{campaign.sentCount}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/campaigns?id=${campaign.id}`)}
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDuplicate(campaign.id)}
                                                    title="Kopyala"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                {campaign.status === "DRAFT" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleSendNow(campaign.id)}
                                                        title="Şimdi Gönder"
                                                    >
                                                        <Send className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(campaign.id)}
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {campaigns.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        Henüz kampanya yok. İlk kampanyanızı oluşturun!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kampanyayı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu kampanyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
