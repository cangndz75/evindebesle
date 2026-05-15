"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { numberToTurkishText } from "@/lib/utils/numberToTurkishText";
import { fromKurus, toKurus } from "@/lib/utils/money";
import { buildGibQrContent, formatQrIssueDate, resolveInvoiceEttn } from "@/lib/invoice/qr";

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
    status: string;
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    shippingCost?: number;
    createdAt: string;
    issuedAt: string | null;
    dueDate: string | null;
    companyDetails: Record<string, unknown>;
    customerDetails: Record<string, unknown>;
    items: InvoiceItem[];
    order: {
        orderNumber: string;
        shippingCost?: number;
        paymentMethod?: string | null;
        cargoCompany?: { name: string; code: string } | null;
        returnRequests?: Array<{
            id: string;
            status: string;
            reason: string;
            refundAmount?: number | null;
            createdAt: string;
            items: Array<{
                id: string;
                quantity: number;
                orderItem: {
                    productName: string;
                    colorName?: string | null;
                    sizeName?: string | null;
                    unitPrice: number;
                    totalPrice: number;
                };
            }>;
        }>;
    };
}

export default function CustomerInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
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

    const OZELLESTIRME_NO = "TR1.2";
    const SENARYO = "EARSIVFATURA";
    const FATURA_TIPI = "SATIS";

    const ETTN = resolveInvoiceEttn({
        invoiceId: invoice.id,
        customerDetails: invoice.customerDetails,
        companyDetails: invoice.companyDetails,
    });

    const customerTaxNumber =
        invoice.customerDetails?.taxNumber &&
        String(invoice.customerDetails?.taxNumber).trim().length > 0
            ? String(invoice.customerDetails?.taxNumber)
            : "-";
    const customerAddressText =
        (invoice.customerDetails?.addressText as string) ||
        [
            invoice.customerDetails?.address &&
                typeof invoice.customerDetails.address === "object"
                ? (invoice.customerDetails.address as Record<string, unknown>)?.district &&
                  typeof (invoice.customerDetails.address as Record<string, unknown>).district === "object"
                    ? [
                          ((invoice.customerDetails.address as Record<string, unknown>).district as Record<string, unknown>)?.name,
                          ((invoice.customerDetails.address as Record<string, unknown>).district as Record<string, unknown>)?.city,
                      ]
                          .filter(Boolean)
                          .join(" ")
                    : ""
                : "",
            invoice.customerDetails?.address &&
                typeof invoice.customerDetails.address === "object"
                ? ((invoice.customerDetails.address as Record<string, unknown>)?.fullAddress as string)
                : "",
        ]
            .filter(Boolean)
            .join(" ");

    const companyName = (invoice.companyDetails?.companyName as string) || "CIHAN MERT OZCAN";
    const companyAddress = (invoice.companyDetails?.companyAddress as string) || "YUNUS MAH. ERSIN SK NO:8/3 KARTAL ISTANBUL";
    const companyPhone = (invoice.companyDetails?.phone as string) || "5356818375";
    const companyEmail = (invoice.companyDetails?.email as string) || "info@dark-velvet.com";
    const companyWebsite = (invoice.companyDetails?.website as string) || "https://www.dark-velvet.com";
    const taxOffice = (invoice.companyDetails?.taxOffice as string) || "KARTAL VERGI DAIRESI MUD";
    const taxNumber = (invoice.companyDetails?.taxNumber as string) || "1063374910";
    const tradeRegistryNo =
        (invoice.companyDetails?.tradeRegistryNo as string) ||
        (invoice.companyDetails?.ticaretSicilNo as string) ||
        "6690628147";
    const logoUrl = invoice.companyDetails?.logoUrl as string | undefined;
    const shippingCost = invoice.order?.shippingCost ?? invoice.shippingCost ?? 0;
    const paymentMethod = invoice.order?.paymentMethod || "-";
    const cargoCompanyName = invoice.order?.cargoCompany?.name || "-";
    const cargoCompanyCode = invoice.order?.cargoCompany?.code || "-";

    const qrPayload = buildGibQrContent({
        sellerTaxId: String(taxNumber).trim() || "11111111111",
        invoiceNumber: invoice.invoiceNumber,
        ettn: ETTN,
        issueDate: formatQrIssueDate(invoice.issuedAt || invoice.createdAt),
        payableAmount: invoice.totalAmount,
    });

    const returnRequests = invoice.order?.returnRequests || [];
    const settledReturn =
        returnRequests.find((r) => r.status === "COMPLETED") ||
        returnRequests.find((r) => r.status === "APPROVED") ||
        null;

    const returnedQuantity = settledReturn
        ? settledReturn.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
        : 0;

    const returnedTotal = settledReturn
        ? typeof settledReturn.refundAmount === "number" && settledReturn.refundAmount > 0
            ? settledReturn.refundAmount
            : settledReturn.items.reduce(
                  (sum, item) =>
                      sum + (Number(item.orderItem?.unitPrice) || 0) * (Number(item.quantity) || 0),
                  0
              )
        : 0;

    const returnedUnitPrice = returnedQuantity > 0 ? returnedTotal / returnedQuantity : 0;

    const returnedKinds = settledReturn
        ? settledReturn.items
              .map((item) => {
                  const base = item.orderItem?.productName || "Ürün";
                  const color = item.orderItem?.colorName ? ` / ${item.orderItem.colorName}` : "";
                  const size = item.orderItem?.sizeName ? ` / ${item.orderItem.sizeName}` : "";
                  return `${base}${color}${size}`;
              })
              .filter(Boolean)
              .join(", ")
        : "-";

    const returnSenderName = (invoice.customerDetails?.name as string) || "-";
    const returnSenderAddress = customerAddressText || "-";

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

            <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg p-8 print:shadow-none print:p-8 print:w-full print:max-w-none relative">
                {/* Satıcı & Logo */}
                <div className="flex justify-between items-start mb-6">
                    <div className="w-1/2 pr-4">
                        <h2 className="font-bold text-sm mb-1 uppercase">{companyName}</h2>
                        <div className="text-gray-700 whitespace-pre-line">{companyAddress}</div>
                        <div className="mt-2">
                            <p>Tel: {companyPhone}</p>
                            <p>E-Posta: {companyEmail}</p>
                            <p>Web Sitesi: {companyWebsite}</p>
                        </div>
                        <div className="mt-2 text-gray-700">
                            <p>Vergi Dairesi: {taxOffice}</p>
                            <p>Vergi Kimlik Numarası: {taxNumber}</p>
                            <p>Ticaret Sicil Numarası: {tradeRegistryNo}</p>
                        </div>
                    </div>

                    <div className="w-1/2 flex flex-col items-end text-right">
                        <div className="flex items-center justify-end gap-2 mb-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                            ) : (
                                <h1 className="text-2xl font-bold text-orange-600">{companyName}</h1>
                            )}
                        </div>
                        <span className="font-bold text-sm">e-Arşiv Fatura</span>
                        <div className="absolute top-8 right-8 text-xs text-gray-500">Sayfa 1 / 1</div>
                        <div className="mt-4 mr-2">
                            <QRCodeCanvas value={qrPayload} size={90} level="M" />
                        </div>
                    </div>
                </div>

                {/* Müşteri & Fatura bilgileri */}
                <div className="flex gap-4 mb-6">
                    <div className="w-1/2">
                        <div className="mb-2">
                            <span className="font-bold underline">SAYIN</span>
                        </div>
                        <div>
                            <p className="font-bold">{invoice.customerDetails?.name as string}</p>
                            <p>{customerAddressText || "-"}</p>
                            <p className="mt-2">E-Posta: {invoice.customerDetails?.email as string}</p>
                            <p>Tel: {invoice.customerDetails?.phone as string}</p>
                            <p>Vergi Dairesi: {(invoice.customerDetails?.taxOffice as string) || "-"}</p>
                            <p>TCKN/VKN: {customerTaxNumber}</p>
                        </div>
                    </div>

                    <div className="w-1/2 pl-8">
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="font-bold py-0.5">Özelleştirme No:</td>
                                    <td>{OZELLESTIRME_NO}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Senaryo:</td>
                                    <td>{SENARYO}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Fatura Tipi:</td>
                                    <td>{FATURA_TIPI}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Fatura No:</td>
                                    <td>{invoice.invoiceNumber}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Fatura Tarihi:</td>
                                    <td>
                                        {invoice.issuedAt
                                            ? format(new Date(invoice.issuedAt), "dd-MM-yyyy", { locale: tr })
                                            : "-"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Son Ödeme Tarihi:</td>
                                    <td>
                                        {invoice.dueDate
                                            ? format(new Date(invoice.dueDate), "dd-MM-yyyy", { locale: tr })
                                            : "-"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Oluşma Zamanı:</td>
                                    <td>
                                        {invoice.createdAt
                                            ? format(new Date(invoice.createdAt), "HH:mm:ss", { locale: tr })
                                            : "-"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Sipariş No:</td>
                                    <td>{invoice.order.orderNumber}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ETTN */}
                <div className="border-t border-gray-200 py-1 text-xs">
                    <span className="font-bold mr-2">ETTN:</span>
                    <span className="font-mono">{ETTN}</span>
                </div>

                {/* İrsaliye */}
                <div className="my-2 text-xs">
                    <p className="font-bold mb-1">İrsaliye Listesi</p>
                    <div className="border border-gray-300 p-1 inline-block">
                        {invoice.issuedAt
                            ? format(new Date(invoice.issuedAt), "dd-MM-yyyy", { locale: tr })
                            : "-"}{" "}
                        {invoice.order.orderNumber}
                    </div>
                </div>

                {/* Ürün tablosu */}
                <div className="mt-4 mb-2">
                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 border-y border-gray-300">
                                <th className="py-1 px-2 text-left border-r border-gray-300 w-8">Sıra No</th>
                                <th className="py-1 px-2 text-left border-r border-gray-300 w-24">Mal Hizmet Kodu</th>
                                <th className="py-1 px-2 text-left border-r border-gray-300">Mal Hizmet Adı</th>
                                <th className="py-1 px-2 text-right border-r border-gray-300 w-16">Miktar</th>
                                <th className="py-1 px-2 text-right border-r border-gray-300 w-20">Birim Fiyat</th>
                                <th className="py-1 px-2 text-right border-r border-gray-300 w-20">
                                    Mal Hizmet Tutarı
                                </th>
                                <th className="py-1 px-2 text-center border-r border-gray-300 w-12">KDV Oranı</th>
                                <th className="py-1 px-2 text-right w-20">KDV Tutarı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => {
                                const taxRate = item.taxRate || 20;
                                const itemTotalKurus = toKurus(item.totalPrice);
                                const taxAmountKurus = Math.round(
                                    (itemTotalKurus * taxRate) / (100 + taxRate)
                                );
                                const exTaxTotalKurus = itemTotalKurus - taxAmountKurus;
                                const exTaxUnitKurus =
                                    item.quantity > 0
                                        ? Math.round(exTaxTotalKurus / item.quantity)
                                        : 0;

                                return (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="py-1 px-2 text-center border-r border-gray-200">
                                            {index + 1}
                                        </td>
                                        <td className="py-1 px-2 border-r border-gray-200">
                                            PROD-{index + 100}
                                        </td>
                                        <td className="py-1 px-2 border-r border-gray-200">
                                            {item.productName}
                                        </td>
                                        <td className="py-1 px-2 text-right border-r border-gray-200">
                                            {item.quantity} Adet
                                        </td>
                                        <td className="py-1 px-2 text-right border-r border-gray-200">
                                            {fromKurus(exTaxUnitKurus).toFixed(2)} TRY
                                        </td>
                                        <td className="py-1 px-2 text-right border-r border-gray-200">
                                            {fromKurus(exTaxTotalKurus).toFixed(2)} TRY
                                        </td>
                                        <td className="py-1 px-2 text-center border-r border-gray-200">
                                            %{taxRate.toFixed(2)}
                                        </td>
                                        <td className="py-1 px-2 text-right">
                                            {fromKurus(taxAmountKurus).toFixed(2)} TRY
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Alt bölüm: barkod + tutar tablosu */}
                <div className="flex gap-4 mt-2">
                    <div className="w-2/3 pr-4 flex flex-col justify-between">
                        <div>
                            <div
                                className="h-12 w-64 mb-1"
                                style={{
                                    background:
                                        "repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)",
                                }}
                            />
                            <p className="font-mono text-[10px] mb-4">{invoice.id}</p>

                            <p className="font-bold text-xs uppercase mb-1">
                                *{numberToTurkishText(invoice.totalAmount)}*
                            </p>

                            <div className="text-[9px] mt-2 space-y-1 text-gray-700">
                                <p>*{invoice.order.orderNumber} nolu sipariş faturası</p>
                                <p>*İrsaliye yerine geçer.</p>
                                <p>*İşletme Merkezi: İstanbul</p>
                                <p>*Bu satış internet üzerinden yapılmıştır.</p>
                                <p>
                                    *Ürün iadesi ve değişimi için kesinlikle ürünün faturası veya
                                    irsaliyesiyle birlikte başvurulması gerekmektedir.
                                </p>
                                <p>
                                    *İşbu faturanin tanziminde yapılan herhangi bir hatadan mütevellit
                                    haklarımız mahfuzdur.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-1/3">
                        <table className="w-full text-xs border border-gray-300">
                            <tbody>
                                <tr>
                                    <td className="p-1 border-b border-gray-300">Mal Hizmet Toplam Tutar:</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">
                                        {invoice.subtotal.toFixed(2)} TRY
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-1 border-b border-gray-300">Vergi Hariç Tutar:</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">
                                        {invoice.subtotal.toFixed(2)} TRY
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-1 border-b border-gray-300">Hesaplanan KDV (%20):</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">
                                        {invoice.taxAmount.toFixed(2)} TRY
                                    </td>
                                </tr>
                                {shippingCost > 0 && (
                                    <tr>
                                        <td className="p-1 border-b border-gray-300">Kargo:</td>
                                        <td className="p-1 text-right font-bold border-b border-gray-300 border-l">
                                            {shippingCost.toFixed(2)} TRY
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-gray-100">
                                    <td className="p-1 font-bold border-b border-gray-300">
                                        Vergiler Dahil Toplam Tutar:
                                    </td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">
                                        {invoice.totalAmount.toFixed(2)} TRY
                                    </td>
                                </tr>
                                <tr className="bg-gray-100">
                                    <td className="p-1 font-bold">Ödenecek Tutar:</td>
                                    <td className="p-1 text-right font-bold border-l">
                                        {invoice.totalAmount.toFixed(2)} TRY
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ödeme / kargo / iade */}
                <div className="mt-8 border-t border-b border-gray-300 py-1 text-[10px]">
                    <div className="grid grid-cols-4 gap-2 font-bold text-center uppercase">
                        <div>Ödeme Şekli/Aracısı</div>
                        <div>Taşıyıcı Adı</div>
                        <div>Taşıyıcı VKN/TCKN</div>
                        <div>Gönderim Tarihi</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mt-1 uppercase">
                        <div>{String(paymentMethod).replaceAll("_", " ")}</div>
                        <div>{cargoCompanyName}</div>
                        <div>{cargoCompanyCode}</div>
                        <div>
                            {invoice.issuedAt
                                ? format(new Date(invoice.issuedAt), "dd.MM.yyyy", { locale: tr })
                                : "-"}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-1 text-[10px] font-bold uppercase">
                    <div className="w-1/2 text-center">MALI İADE EDEN</div>
                    <div className="w-1/2 text-center">İADE EDİLEN</div>
                </div>
                <div className="flex justify-between mt-8 text-[10px]">
                    <div className="w-1/2 px-4 space-y-1">
                        <p>Adı Soyadı: {returnSenderName}</p>
                        <p>Adresi: {returnSenderAddress}</p>
                        <p className="mt-4">İmza: ............................................</p>
                    </div>
                    <div className="w-1/2 px-4 space-y-1 text-right">
                        <div className="flex justify-end gap-2">
                            <span className="w-20 text-left">Cinsi:</span>
                            <span
                                className="w-56 border-b border-gray-300 text-left truncate"
                                title={returnedKinds}
                            >
                                {returnedKinds}
                            </span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="w-20 text-left">Miktar:</span>
                            <span className="w-56 border-b border-gray-300 text-left">
                                {settledReturn ? `${returnedQuantity} Adet` : "-"}
                            </span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="w-20 text-left">Birim Fiyat:</span>
                            <span className="w-56 border-b border-gray-300 text-left">
                                {settledReturn ? `${returnedUnitPrice.toFixed(2)} TRY` : "-"}
                            </span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="w-20 text-left">Tutar:</span>
                            <span className="w-56 border-b border-gray-300 text-left">
                                {settledReturn ? `${returnedTotal.toFixed(2)} TRY` : "-"}
                            </span>
                        </div>
                        {!settledReturn && (
                            <p className="text-[9px] text-gray-500 mt-2 text-left">
                                Bu fatura için onaylanmış/tamamlanmış iade kaydı bulunmuyor.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-8 {
                        padding: 10mm !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
