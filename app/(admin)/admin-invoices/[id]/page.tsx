"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface InvoiceItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string;
    status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    createdAt: string;
    issuedAt: string | null;
    dueDate: string | null;
    companyDetails: any;
    customerDetails: any;
    items: InvoiceItem[];
    order: {
        orderNumber: string;
    };
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white">
            {/* Header - Hidden in Print */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Fatura Detayı</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Yazdır
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF İndir
                    </Button>
                    <Button>
                        <Mail className="w-4 h-4 mr-2" />
                        E-posta Gönder
                    </Button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 print:shadow-none print:p-0 print:w-full print:max-w-none">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">FATURA</h1>
                        <p className="text-gray-500">#{invoice.invoiceNumber}</p>
                        <div className="mt-4 space-y-1 text-sm text-gray-600">
                            <p>
                                <span className="font-semibold">Düzenleme Tarihi:</span>{" "}
                                {invoice.issuedAt
                                    ? format(new Date(invoice.issuedAt), "dd.MM.yyyy", { locale: tr })
                                    : "-"}
                            </p>
                            <p>
                                <span className="font-semibold">Vade Tarihi:</span>{" "}
                                {invoice.dueDate
                                    ? format(new Date(invoice.dueDate), "dd.MM.yyyy", { locale: tr })
                                    : "-"}
                            </p>
                            <p>
                                <span className="font-semibold">Durum:</span>{" "}
                                <span className={`uppercase font-medium ${invoice.status === 'PAID' ? 'text-green-600' :
                                        invoice.status === 'ISSUED' ? 'text-blue-600' : 'text-gray-600'
                                    }`}>
                                    {invoice.status === 'ISSUED' ? 'KESİLDİ' : invoice.status}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        {/* Logo placeholder */}
                        {invoice.companyDetails?.logoUrl ? (
                            <img src={invoice.companyDetails.logoUrl} alt="Logo" className="h-12 w-auto ml-auto mb-4" />
                        ) : (
                            <div className="text-2xl font-bold text-gray-800 mb-4">{invoice.companyDetails?.companyName || "COMPANY NAME"}</div>
                        )}
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-semibold">{invoice.companyDetails?.companyName || "Şirket Adı"}</p>
                            <p>{invoice.companyDetails?.companyAddress || "Adres Bilgisi"}</p>
                            <p>{invoice.companyDetails?.email || "email@company.com"}</p>
                            <p>{invoice.companyDetails?.phone || "+90 555 555 55 55"}</p>
                            {invoice.companyDetails?.taxOffice && <p>VD: {invoice.companyDetails.taxOffice}</p>}
                            {invoice.companyDetails?.taxNumber && <p>VN: {invoice.companyDetails.taxNumber}</p>}
                        </div>
                    </div>
                </div>

                {/* Client & Shipping Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">SAYIN</h3>
                        <div className="text-gray-700">
                            <p className="font-semibold text-lg">{invoice.customerDetails?.name}</p>
                            <p>{invoice.customerDetails?.address?.fullAddress}</p>
                            <p>{invoice.customerDetails?.address?.district?.name} / {invoice.customerDetails?.address?.district?.city}</p>
                            <p className="mt-2">{invoice.customerDetails?.email}</p>
                            <p>{invoice.customerDetails?.phone}</p>
                        </div>
                    </div>
                    {/* Additional Info could go here */}
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 font-semibold text-gray-600">Ürün / Hizmet</th>
                                <th className="py-3 font-semibold text-gray-600 text-center">Miktar</th>
                                <th className="py-3 font-semibold text-gray-600 text-right">Birim Fiyat</th>
                                <th className="py-3 font-semibold text-gray-600 text-right">Toplam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-4 text-gray-800">{item.productName}</td>
                                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-gray-600">{item.unitPrice?.toFixed(2)} ₺</td>
                                    <td className="py-4 text-right font-medium text-gray-800">{item.totalPrice?.toFixed(2)} ₺</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end border-t pt-8">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Ara Toplam</span>
                            <span>{invoice.subtotal.toFixed(2)} ₺</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>KDV (%20)</span>
                            <span>{invoice.taxAmount.toFixed(2)} ₺</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3 mt-3">
                            <span>GENEL TOPLAM</span>
                            <span>{invoice.totalAmount.toFixed(2)} ₺</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t mt-12 pt-8 text-center text-sm text-gray-500 print:fixed print:bottom-0 print:left-0 print:w-full print:mb-8">
                    <p>Bu fatura elektronik ortamda düzenlenmiştir.</p>
                    <p className="mt-2">Ödemeniz vadesi gelen faturalar için teşekkür ederiz.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            .print\\:p-0, .print\\:p-0 * {
                visibility: visible;
            }
            .print\\:p-0 {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0 !important;
                background: white;
            }
            /* Hide layout elements */
            aside, nav, header, .fixed, .print\\:hidden {
                display: none !important;
            }
        }
      `}</style>
        </div>
    );
}
