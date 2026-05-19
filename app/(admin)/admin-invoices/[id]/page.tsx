"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocument, type InvoiceDocumentData } from "@/components/invoice/InvoiceDocument";
import { InvoicePrintStyles } from "@/components/invoice/InvoicePrintStyles";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<InvoiceDocumentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/admin/invoices/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setInvoice(data);
                } else {
                    toast.error("Fatura bulunamadı");
                    router.push("/admin-invoices");
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
                toast.error("Bir hata oluştu");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchInvoice();
        }
    }, [params.id, router]);

    const handlePrint = () => {
        window.print();
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
