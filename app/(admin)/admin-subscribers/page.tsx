"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Trash2,
    Search,
    RefreshCw,
    UserX,
    UserCheck,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Subscriber {
    id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminSubscribersPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [subscriberToDelete, setSubscriberToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (sessionStatus === "loading") return;

        if (!session) {
            router.push("/auth-tabs");
            return;
        }

        fetchSubscribers();
    }, [session, sessionStatus, router, page]);

    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/subscribers?page=${page}&search=${search}`);
            if (response.ok) {
                const data = await response.json();
                setSubscribers(data.subscribers || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching subscribers:", error);
            toast.error("Aboneler yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (subscriber: Subscriber) => {
        try {
            const response = await fetch("/api/admin/subscribers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: subscriber.id,
                    isActive: !subscriber.isActive,
                }),
            });

            if (response.ok) {
                toast.success(subscriber.isActive ? "Abonelik donduruldu" : "Abonelik aktifleştirildi");
                setSubscribers(subscribers.map(s =>
                    s.id === subscriber.id ? { ...s, isActive: !s.isActive } : s
                ));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Durum güncellenemedi");
        }
    };

    const handleDelete = async (id: string) => {
        setSubscriberToDelete(id);
        setConfirmDeleteOpen(true);
    };

    const performDelete = async () => {
        if (!subscriberToDelete) return;

        try {
            const response = await fetch(`/api/admin/subscribers?id=${subscriberToDelete}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Abone silindi");
                setSubscribers(subscribers.filter((s) => s.id !== subscriberToDelete));
                setTotal(total - 1);
            }
        } catch (error) {
            console.error("Error deleting subscriber:", error);
            toast.error("Silme başarısız");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchSubscribers();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bülten Aboneleri</h1>
                    <p className="text-gray-500">Bülten abonelerinizi yönetin</p>
                </div>
                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearch} className="relative w-64 md:w-80">
                        <Input
                            placeholder="Email ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <button type="submit" className="hidden" />
                    </form>
                    <Button variant="outline" size="icon" onClick={() => fetchSubscribers()} title="Yenile">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Abone Listesi ({total})</CardTitle>
                    <CardDescription>
                        Web siteniz üzerinden bültene kayıt olan kullanıcılar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && subscribers.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Abone bulunamadı.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Katılım Tarihi</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subscribers.map((subscriber) => (
                                        <TableRow key={subscriber.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    {subscriber.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={subscriber.isActive ? "default" : "secondary"}>
                                                    {subscriber.isActive ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-500">
                                                    {format(new Date(subscriber.createdAt), "d MMM yyyy HH:mm", {
                                                        locale: tr,
                                                    })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(subscriber)}
                                                        title={subscriber.isActive ? "Dondur" : "Aktifleştir"}
                                                    >
                                                        {subscriber.isActive ? (
                                                            <UserX className="w-4 h-4 text-yellow-600" />
                                                        ) : (
                                                            <UserCheck className="w-4 h-4 text-green-600" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(subscriber.id)}
                                                        className="text-red-600"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {total > subscribers.length && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        disabled={isLoading}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Daha Fazla Yükle
                                    </Button>
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
                title="Aboneyi Sil"
                description="Bu aboneyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
            />
        </div>
    );
}
