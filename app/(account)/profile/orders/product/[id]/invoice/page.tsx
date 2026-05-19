"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocument, type InvoiceDocumentData } from "@/components/invoice/InvoiceDocument";
import { InvoicePrintStyles } from "@/components/invoice/InvoicePrintStyles";

export default function CustomerInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<InvoiceDocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/orders/${params.id}/invoice-data`);
                if (res.ok) {
                    const data = await res.json();
                    setInvoice(data);
                } else {
                    const body = await res.json().catch(() => ({}));
                    toast.error(typeof body?.error === "string" ? body.error : "Fatura bulunamadı");
                    router.back();
                }
            } catch {
                toast.error("Bir hata oluştu");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchInvoice();
        }
    }, [params.id, router]);

    const handlePrint = () => window.print();

    const handleDownloadPdf = async () => {
        if (!invoice) return;
        setDownloading(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/invoice`, { credentials: "same-origin" });
            if (!res.ok) throw new Error("Fatura indirilemedi");
            const ct = res.headers.get("content-type") || "";
            const ext = ct.includes("text/html") ? "html" : "pdf";
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `fatura-${invoice.order.orderNumber}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Fatura indirildi");
        } catch {
            toast.error("Fatura indirilemedi");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white text-[11px] leading-tight font-sans text-black">
            <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-xl font-bold">Fatura Önizleme</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
                        <Download className="w-4 h-4 mr-2" />
                        {downloading ? "İndiriliyor..." : "PDF İndir"}
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Yazdır
                    </Button>
                </div>
            </div>

            <InvoiceDocument invoice={invoice} />
            <InvoicePrintStyles />
        </div>
    );
}
