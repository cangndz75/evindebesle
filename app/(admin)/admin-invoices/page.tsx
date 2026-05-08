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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText, Search, Printer, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string;
    status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
    totalAmount: number;
    createdAt: string;
    issuedAt: string | null;
    order: {
        orderNumber: string;
        user: {
            name: string;
            email: string;
        }
    };
}

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fullyMask = (value: string | null | undefined) => {
        if (!value) return "********";
        return "*".repeat(Math.max(8, Math.min(16, value.length)));
    };

    const maskNameToInitials = (name: string | null | undefined) => {
        if (!name) return "--";
        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) return "--";

        return parts
            .slice(0, 2)
            .map((part) => `${part[0]?.toUpperCase()}.`)
            .join(" ");
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("invoiceNumber", searchQuery);

            const res = await fetch(`/api/admin/invoices?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
            toast.error("Faturalar yüklenirken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            DRAFT: { label: "Taslak", className: "bg-gray-100 text-gray-800" },
            ISSUED: { label: "Kesildi", className: "bg-blue-100 text-blue-800" },
            PAID: { label: "Ödendi", className: "bg-green-100 text-green-800" },
            CANCELLED: { label: "İptal", className: "bg-red-100 text-red-800" },
        };
        const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
        return (
            <Badge className={statusInfo.className}>
                {statusInfo.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">Faturalar</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Fatura no ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz fatura bulunmuyor</p>
                </div>
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fatura No</TableHead>
                                <TableHead>Sipariş No</TableHead>
                                <TableHead>Müşteri</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>
                                        <Link href={`/admin-orders/${invoice.orderId}`} className="text-blue-600 hover:underline">
                                            {invoice.order.orderNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{maskNameToInitials(invoice.order.user.name)}</div>
                                            <div className="text-sm text-muted-foreground">{fullyMask(invoice.order.user.email)}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: tr })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {invoice.totalAmount.toFixed(2)} ₺
                                    </TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin-invoices/${invoice.id}`}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Görüntüle
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/admin-invoices/${invoice.id}`, '_blank')}>
                                                    <Printer className="w-4 h-4 mr-2" />
                                                    Yazdır
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
