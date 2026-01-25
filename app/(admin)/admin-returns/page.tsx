"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, CheckCircle, XCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

type ReturnItem = {
    id: string;
    quantity: number;
    reason: string;
    orderItem: {
        productName: string;
        product: {
            image: string | null;
        };
    };
};

type ReturnRequest = {
    id: string;
    order: {
        orderNumber: string;
    };
    user: {
        name: string;
        email: string;
    };
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    reason: string;
    description: string | null;
    refundAmount: number | null;
    createdAt: string;
    items: ReturnItem[];
};

export default function AdminReturnsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [adminNote, setAdminNote] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/returns");
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Error fetching returns:", error);
            toast.error("İade talepleri yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedRequest) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/returns/${selectedRequest.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    adminNote,
                }),
            });

            if (res.ok) {
                toast.success(status === "APPROVED" ? "İade onaylandı" : "İade reddedildi");
                setModalOpen(false);
                fetchReturns();
            } else {
                throw new Error("İşlem başarısız");
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-yellow-100 text-yellow-800">Bekliyor</Badge>;
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-800">Onaylandı</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-800">Reddedildi</Badge>;
            case "COMPLETED":
                return <Badge className="bg-blue-100 text-blue-800">Tamamlandı</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">İade Yönetimi</h1>
                    <p className="text-sm text-gray-600">İade talepleri ve RMA süreçleri</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Henüz iade talebi bulunmuyor.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Sipariş No</TableHead>
                                    <TableHead>Müşteri</TableHead>
                                    <TableHead>Neden</TableHead>
                                    <TableHead>Ürünler</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="text-gray-600">
                                            {format(new Date(req.createdAt), "dd MMM yyyy", { locale: tr })}
                                        </TableCell>
                                        <TableCell className="font-medium">#{req.order.orderNumber}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{req.user.name}</div>
                                                <div className="text-xs text-gray-500">{req.user.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {req.items.length} ürün
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setModalOpen(true);
                                                    setAdminNote("");
                                                }}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                İncele
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* İade Detay Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>İade Talebi Detayı</DialogTitle>
                        <DialogDescription>
                            Sipariş #{selectedRequest?.order.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-gray-500">Müşteri</label>
                                    <p className="font-medium">{selectedRequest.user.name}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500">Neden</label>
                                    <p className="font-medium">{selectedRequest.reason}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-gray-500">Açıklama</label>
                                    <p className="p-3 bg-gray-50 rounded mt-1">{selectedRequest.description || "-"}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">İade Edilen Ürünler</h4>
                                <div className="space-y-2">
                                    {selectedRequest.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                                            {item.orderItem.product.image && (
                                                <img
                                                    src={item.orderItem.product.image}
                                                    className="w-12 h-12 object-cover rounded"
                                                    alt=""
                                                />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.orderItem.productName}</p>
                                                <p className="text-xs text-gray-500">Miktar: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedRequest.status === "PENDING" && (
                                <div>
                                    <label className="font-semibold mb-2 block">Yönetici Notu</label>
                                    <Textarea
                                        placeholder="Onay veya ret sebebi..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Kapat</Button>
                        {selectedRequest?.status === "PENDING" && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction("REJECTED")}
                                    disabled={processing}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reddet
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAction("APPROVED")}
                                    disabled={processing}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Onayla
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
