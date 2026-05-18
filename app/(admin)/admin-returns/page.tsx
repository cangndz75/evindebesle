"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    RotateCcw,
    CheckCircle,
    XCircle,
    Eye,
    PackageCheck,
    Loader2,
    AlertTriangle,
    User,
    Package,
    ImageIcon,
    CreditCard,
    Copy,
    ExternalLink,
    FileDown,
} from "lucide-react";

const RETURN_REASON_LABELS: Record<string, string> = {
    WRONG_SIZE: "Beden uygun değil",
    WRONG_COLOR: "Renk beklediğim gibi değil",
    DAMAGED: "Ürün hasarlı geldi",
    WRONG_PRODUCT: "Yanlış ürün gönderildi",
    NOT_AS_DESCRIBED: "Ürün açıklamayla uyuşmuyor",
    CHANGED_MIND: "Fikir değişikliği",
    OTHER: "Diğer",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Kargo Bekleniyor", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    RECEIVED: { label: "Teslim Alındı", className: "bg-blue-100 text-blue-800 border-blue-200" },
    APPROVED: { label: "Onaylandı", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    REJECTED: { label: "Reddedildi", className: "bg-red-100 text-red-800 border-red-200" },
    REFUNDED: { label: "İade Edildi", className: "bg-green-100 text-green-800 border-green-200" },
    COMPLETED: { label: "Tamamlandı", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

type ReturnItem = {
    id: string;
    quantity: number;
    reason: string | null;
    orderItem: {
        id: string;
        productName: string;
        colorName: string | null;
        sizeName: string | null;
        unitPrice: number;
        totalPrice: number;
        product: {
            id: string;
            image: string | null;
            primaryImage: string | null;
        };
        color: { name: string } | null;
        size: { name: string } | null;
    };
};

type ReturnRequest = {
    id: string;
    orderId: string;
    order: {
        id: string;
        orderNumber: string;
        total: number;
        paidAt: string | null;
        status: string;
    };
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
    status: string;
    reason: string;
    description: string | null;
    images: string[];
    adminNote: string | null;
    refundAmount: number | null;
    bankReferenceCode: string | null;
    cargoTrackingCode: string | null;
    cargoTrackingUrl: string | null;
    cargoPdfUrl: string | null;
    shipinkOrderId: string | null;
    receivedAt: string | null;
    refundedAt: string | null;
    createdAt: string;
    items: ReturnItem[];
};

type StatusTab = "ALL" | "PENDING" | "RECEIVED" | "REJECTED" | "REFUNDED";

export default function AdminReturnsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const openedFromQuery = useRef(false);

    const [requests, setRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [adminNote, setAdminNote] = useState("");

    const [confirmAction, setConfirmAction] = useState<"receive" | "reject" | "refund" | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const [listRes, countRes] = await Promise.all([
                fetch(`/api/admin/returns${activeTab !== "ALL" ? `?status=${activeTab}` : ""}`),
                fetch("/api/admin/returns?countOnly=true"),
            ]);
            if (listRes.ok) setRequests(await listRes.json());
            if (countRes.ok) setStatusCounts(await countRes.json());
        } catch {
            toast.error("İade talepleri yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const openDetail = (req: ReturnRequest) => {
        setSelectedRequest(req);
        setAdminNote(req.adminNote || "");
        setDetailOpen(true);
    };

    useEffect(() => {
        const returnId = searchParams.get("returnId");
        if (!returnId) {
            openedFromQuery.current = false;
            return;
        }
        if (openedFromQuery.current) return;

        const match = requests.find((r) => r.id === returnId);
        if (match) {
            openedFromQuery.current = true;
            openDetail(match);
            router.replace("/admin-returns", { scroll: false });
            return;
        }

        if (loading) return;

        fetch(`/api/admin/returns/${returnId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: ReturnRequest | null) => {
                if (!data || data.id !== returnId || openedFromQuery.current) return;
                openedFromQuery.current = true;
                openDetail(data);
                router.replace("/admin-returns", { scroll: false });
            })
            .catch(() => {});
    }, [searchParams, requests, loading, router]);

    const openConfirm = (action: "receive" | "reject" | "refund") => {
        setConfirmAction(action);
        setConfirmOpen(true);
    };

    const executeAction = async () => {
        if (!selectedRequest || !confirmAction) return;
        setProcessing(true);

        try {
            const res = await fetch(`/api/admin/returns/${selectedRequest.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: confirmAction, adminNote }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "İşlem başarısız");
            }

            const messages: Record<string, string> = {
                receive: "Ürün teslim alındı olarak işaretlendi",
                reject: "İade talebi reddedildi",
                refund: `İade onaylandı ve ${data.refundAmount?.toFixed(2) || ""} TL iade edildi`,
            };
            toast.success(messages[confirmAction]);
            setConfirmOpen(false);
            setDetailOpen(false);
            fetchReturns();
        } catch (error: any) {
            toast.error(error.message || "İşlem sırasında hata oluştu");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-800" };
        return <Badge className={`${config.className} border`}>{config.label}</Badge>;
    };

    const formatPrice = (v: number) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

    const tabCounts: { key: StatusTab; label: string }[] = [
        { key: "ALL", label: `Tümü (${statusCounts.total || 0})` },
        { key: "PENDING", label: `Bekleyen (${statusCounts.PENDING || 0})` },
        { key: "RECEIVED", label: `Teslim Alınan (${statusCounts.RECEIVED || 0})` },
        { key: "REJECTED", label: `Reddedilen (${statusCounts.REJECTED || 0})` },
        { key: "REFUNDED", label: `İade Edilen (${statusCounts.REFUNDED || 0})` },
    ];

    const refundTotal = selectedRequest
        ? selectedRequest.items.reduce((s, i) => s + i.orderItem.unitPrice * i.quantity, 0)
        : 0;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">İade Yönetimi</h1>
                <p className="text-sm text-gray-500 mt-1">
                    İade taleplerini inceleyin, onaylayın veya reddedin
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusTab)}>
                <TabsList className="w-full flex-wrap h-auto gap-1">
                    {tabCounts.map((t) => (
                        <TabsTrigger key={t.key} value={t.key} className="text-xs sm:text-sm">
                            {t.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Bu kategoride iade talebi bulunmuyor.</p>
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
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => {
                                    const itemTotal = req.items.reduce(
                                        (s, i) => s + i.orderItem.unitPrice * i.quantity,
                                        0
                                    );
                                    return (
                                        <TableRow key={req.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(req)}>
                                            <TableCell className="text-gray-600 text-sm">
                                                {format(new Date(req.createdAt), "dd MMM yyyy", { locale: tr })}
                                            </TableCell>
                                            <TableCell className="font-medium">#{req.order.orderNumber}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="font-medium">{req.user.name}</div>
                                                    <div className="text-xs text-gray-500">{req.user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {RETURN_REASON_LABELS[req.reason] || req.reason}
                                            </TableCell>
                                            <TableCell className="text-sm">{req.items.length} ürün</TableCell>
                                            <TableCell className="font-medium text-sm">{formatPrice(itemTotal)}</TableCell>
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(req); }}>
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    İncele
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* DETAIL MODAL */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5" />
                            İade Talebi Detayı
                        </DialogTitle>
                        <DialogDescription>
                            Sipariş #{selectedRequest?.order.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6">
                            {/* Status Bar */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">Durum:</span>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    {format(new Date(selectedRequest.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                        <User className="w-4 h-4" />
                                        Müşteri Bilgileri
                                    </div>
                                    <p className="text-sm"><span className="text-gray-500">Ad:</span> {selectedRequest.user.name}</p>
                                    <p className="text-sm"><span className="text-gray-500">E-posta:</span> {selectedRequest.user.email}</p>
                                    {selectedRequest.user.phone && (
                                        <p className="text-sm"><span className="text-gray-500">Telefon:</span> {selectedRequest.user.phone}</p>
                                    )}
                                </div>

                                <div className="bg-white border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                        <CreditCard className="w-4 h-4" />
                                        Sipariş Bilgileri
                                    </div>
                                    <p className="text-sm">
                                        <span className="text-gray-500">Sipariş Tutarı:</span>{" "}
                                        <span className="font-semibold">{formatPrice(selectedRequest.order.total)}</span>
                                    </p>
                                    <p className="text-sm">
                                        <span className="text-gray-500">İade Tutarı:</span>{" "}
                                        <span className="font-semibold text-orange-600">{formatPrice(refundTotal)}</span>
                                    </p>
                                    {selectedRequest.cargoTrackingCode && (
                                        <p className="text-sm">
                                            <span className="text-gray-500">Kargo kodu:</span>{" "}
                                            <span className="font-mono">{selectedRequest.cargoTrackingCode}</span>
                                        </p>
                                    )}
                                    {(selectedRequest.shipinkOrderId ||
                                        selectedRequest.cargoTrackingUrl ||
                                        selectedRequest.cargoPdfUrl) && (
                                        <div className="mt-3 space-y-2 border-t pt-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Shipink
                                            </p>
                                            {selectedRequest.shipinkOrderId && (
                                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                                    <span className="text-gray-500 shrink-0">Sipariş ID:</span>
                                                    <span className="font-mono text-xs break-all text-gray-900">
                                                        {selectedRequest.shipinkOrderId}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-gray-600"
                                                        onClick={() => {
                                                            void navigator.clipboard
                                                                .writeText(selectedRequest.shipinkOrderId!)
                                                                .then(() => toast.success("Shipink sipariş ID kopyalandı"))
                                                                .catch(() => toast.error("Kopyalanamadı"));
                                                        }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                            {selectedRequest.cargoTrackingUrl && (
                                                <a
                                                    href={selectedRequest.cargoTrackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Kargo durumunu takip et
                                                </a>
                                            )}
                                            {selectedRequest.cargoPdfUrl && (
                                                <a
                                                    href={selectedRequest.cargoPdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 hover:underline"
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                    İade etiketi (PDF)
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {selectedRequest.bankReferenceCode && (
                                        <p className="text-sm pt-1 border-t mt-2">
                                            <span className="text-gray-500">Banka / Iyzico referansı:</span>{" "}
                                            <span className="font-mono text-xs break-all">{selectedRequest.bankReferenceCode}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="border rounded-lg p-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-700">İade Nedeni</p>
                                <p className="text-sm">{RETURN_REASON_LABELS[selectedRequest.reason] || selectedRequest.reason}</p>
                                {selectedRequest.description && (
                                    <>
                                        <p className="text-sm font-semibold text-gray-700 pt-2">Açıklama</p>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                                            {selectedRequest.description}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Items */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                    <Package className="w-4 h-4" />
                                    İade Edilen Ürünler
                                </div>
                                <div className="space-y-3">
                                    {selectedRequest.items.map((item) => {
                                        const img = item.orderItem.product?.primaryImage || item.orderItem.product?.image;
                                        return (
                                            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                                {img ? (
                                                    <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg" />
                                                ) : (
                                                    <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{item.orderItem.productName}</p>
                                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                                                        {item.orderItem.color?.name && <span>Renk: {item.orderItem.color.name}</span>}
                                                        {item.orderItem.size?.name && <span>Beden: {item.orderItem.size.name}</span>}
                                                        <span>Adet: {item.quantity}</span>
                                                    </div>
                                                    {item.reason && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Neden: {RETURN_REASON_LABELS[item.reason] || item.reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-sm font-semibold whitespace-nowrap">
                                                    {formatPrice(item.orderItem.unitPrice * item.quantity)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Customer Photos */}
                            {selectedRequest.images && selectedRequest.images.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                        <ImageIcon className="w-4 h-4" />
                                        Müşteri Görselleri
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {selectedRequest.images.map((url, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedImage(url);
                                                    setImageModalOpen(true);
                                                }}
                                                className="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-black transition-all"
                                            >
                                                <img src={url} alt={`Hasar görseli ${idx + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                {selectedRequest.receivedAt && (
                                    <span>Teslim Alınma: {format(new Date(selectedRequest.receivedAt), "dd.MM.yyyy HH:mm")}</span>
                                )}
                                {selectedRequest.refundedAt && (
                                    <span>İade Tarihi: {format(new Date(selectedRequest.refundedAt), "dd.MM.yyyy HH:mm")}</span>
                                )}
                                {selectedRequest.refundAmount != null && (
                                    <span>İade Tutarı: {formatPrice(selectedRequest.refundAmount)}</span>
                                )}
                            </div>

                            {/* Admin Note */}
                            {(selectedRequest.status === "PENDING" || selectedRequest.status === "RECEIVED") && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">Yönetici Notu</label>
                                    <Textarea
                                        placeholder="Onay veya ret sebebi yazabilirsiniz..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                            )}

                            {/* Existing Admin Note Display */}
                            {selectedRequest.adminNote && selectedRequest.status !== "PENDING" && selectedRequest.status !== "RECEIVED" && (
                                <div className="border rounded-lg p-4 bg-yellow-50">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Yönetici Notu</p>
                                    <p className="text-sm text-gray-600">{selectedRequest.adminNote}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>Kapat</Button>

                        {selectedRequest?.status === "PENDING" && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => openConfirm("reject")}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    İadeyi Reddet
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => openConfirm("receive")}
                                >
                                    <PackageCheck className="w-4 h-4 mr-2" />
                                    Ürün Teslim Alındı
                                </Button>
                            </>
                        )}

                        {selectedRequest?.status === "RECEIVED" && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => openConfirm("reject")}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    İadeyi Reddet
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => openConfirm("refund")}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    İadeyi Onayla ve Ücreti Yatır
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION MODAL */}
            <Dialog open={confirmOpen} onOpenChange={(open) => !processing && setConfirmOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            {confirmAction === "receive" && "Ürün Teslim Alındı Olarak İşaretle"}
                            {confirmAction === "reject" && "İade Talebini Reddet"}
                            {confirmAction === "refund" && "İadeyi Onayla ve Ücreti İade Et"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction === "receive" &&
                                "Ürün depoya ulaştı olarak işaretlenecek. İnceleme sonrası onay/ret verilebilecektir."}
                            {confirmAction === "reject" &&
                                "İade talebi reddedilecek ve müşteriye e-posta ile bilgi verilecektir. Bu işlem geri alınamaz."}
                            {confirmAction === "refund" && selectedRequest && (
                                <>
                                    <span className="font-semibold text-black">{formatPrice(refundTotal)}</span>
                                    {" "}tutarında iade Iyzico üzerinden müşterinin kartına yatırılacaktır. Bu işlem geri alınamaz.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={processing}>
                            Vazgeç
                        </Button>
                        <Button
                            onClick={executeAction}
                            disabled={processing}
                            className={
                                confirmAction === "reject"
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : confirmAction === "refund"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                            }
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    {confirmAction === "receive" && "Teslim Alındı Olarak İşaretle"}
                                    {confirmAction === "reject" && "Evet, Reddet"}
                                    {confirmAction === "refund" && "Evet, İade Et"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* IMAGE LIGHTBOX */}
            <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="max-w-2xl p-2">
                    {selectedImage && (
                        <img src={selectedImage} alt="Hasar görseli" className="w-full rounded-lg" />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
