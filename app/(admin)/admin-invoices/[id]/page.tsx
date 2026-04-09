"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { numberToTurkishText } from "@/lib/utils/numberToTurkishText";
import { fromKurus, toKurus } from "@/lib/utils/money";

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
    couponDiscount: number; // Add if available in API
    shippingCost: number;   // Add if available in API
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

    const OZELLESTIRME_NO = "TR1.2";
    const SENARYO = "EARSIVFATURA";
    const FATURA_TIPI = "SATIS";

    const ETTN = invoice.id;

    const customerTaxNumber =
        invoice.customerDetails?.taxNumber && String(invoice.customerDetails?.taxNumber).trim().length > 0
            ? String(invoice.customerDetails?.taxNumber)
            : "11111111111";
    const customerAddressText =
        invoice.customerDetails?.addressText ||
        [
            invoice.customerDetails?.address?.district?.name,
            invoice.customerDetails?.address?.district?.city,
            invoice.customerDetails?.address?.fullAddress,
        ]
            .filter(Boolean)
            .join(" ");

    const companyName = invoice.companyDetails?.companyName || "EVİNDEBESLE E-TİC.";
    const companyAddress = invoice.companyDetails?.companyAddress || "Merkez Mah. Örnek Cad. No:1 İstanbul";
    const companyPhone = invoice.companyDetails?.phone || "+90 212 111 22 33";
    const companyEmail = invoice.companyDetails?.email || "info@dark-velvet.com";
    const taxOffice = invoice.companyDetails?.taxOffice || "Marmara Kurumlar";
    const taxNumber = invoice.companyDetails?.taxNumber || "1234567890";
    const mersisNo = "0388023942900019"; // Example
    const logoUrl = invoice.companyDetails?.logoUrl; // Could be null

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

            
            <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg p-8 print:shadow-none print:p-8 print:w-full print:max-w-none relative">

                
                <div className="flex justify-between items-start mb-6">
                    
                    <div className="w-1/2 pr-4">
                        <h2 className="font-bold text-sm mb-1 uppercase">{companyName}</h2>
                        <div className="text-gray-700 whitespace-pre-line">
                            {companyAddress}
                        </div>
                        <div className="mt-2">
                            <p>Tel: {companyPhone}</p>
                            <p>E-Posta: {companyEmail}</p>
                            <p>Web Sitesi: https://dark-velvet.com</p>
                        </div>
                        <div className="mt-2 text-gray-700">
                            <p>Vergi Dairesi: {taxOffice}</p>
                            <p>Vergi Kimlik Numarası: {taxNumber}</p>
                            <p>Mersis No: {mersisNo}</p>
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
                        <div className="flex flex-col items-center">
                            
                            
                            <span className="font-bold text-sm">e-Arşiv Fatura</span>
                        </div>

                        
                        <div className="absolute top-8 right-8 text-xs text-gray-500">
                            Sayfa 1 / 1
                        </div>

                        
                        <div className="mt-4 mr-2">
                            <QRCodeCanvas
                                value={`https://gib.gov.tr/fatura/${invoice.invoiceNumber}`}
                                size={90}
                                level={"M"}
                            />
                        </div>
                    </div>
                </div>

                
                <div className="flex gap-4 mb-6">
                    
                    <div className="w-1/2">
                        <div className="mb-2">
                            <span className="font-bold underline">SAYIN</span>
                        </div>
                        <div className="pl-0">
                            <p className="font-bold">{invoice.customerDetails?.name}</p>
                            <p>{customerAddressText || "-"}</p>
                            <p>{invoice.customerDetails?.address?.district?.name} / {invoice.customerDetails?.address?.district?.city}</p>
                            <p className="mt-2">E-Posta: {invoice.customerDetails?.email}</p>
                            <p>Tel: {invoice.customerDetails?.phone}</p>
                            <p>Vergi Dairesi: {invoice.customerDetails?.taxOffice || "-"}</p>
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
                                    <td>{invoice.issuedAt ? format(new Date(invoice.issuedAt), "dd-MM-yyyy", { locale: tr }) : "-"}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Son Ödeme Tarihi:</td>
                                    <td>{invoice.dueDate ? format(new Date(invoice.dueDate), "dd-MM-yyyy", { locale: tr }) : "-"}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Oluşma Zamanı:</td>
                                    <td>{invoice.createdAt ? format(new Date(invoice.createdAt), "HH:mm:ss", { locale: tr }) : "-"}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5">Sipariş No:</td>
                                    <td>{invoice.order.orderNumber}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                
                <div className="border-t border-gray-200 py-1 text-xs">
                    <span className="font-bold mr-2">ETTN:</span>
                    <span className="font-mono">{ETTN}</span>
                </div>

                
                <div className="my-2 text-xs">
                    <p className="font-bold mb-1">İrsaliye Listesi</p>
                    <div className="border border-gray-300 p-1 inline-block">
                        {invoice.issuedAt ? format(new Date(invoice.issuedAt), "dd-MM-yyyy", { locale: tr }) : "-"} {invoice.order.orderNumber}
                    </div>
                </div>

                
                <div className="mt-4 mb-2">
                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 border-y border-gray-300">
                                <th className="py-1 px-2 text-left border-r border-gray-300 w-8">Sıra No</th>
                                <th className="py-1 px-2 text-left border-r border-gray-300 w-24">Mal Hizmet Kodu</th>
                                <th className="py-1 px-2 text-left border-r border-gray-300">Mal Hizmet Adı</th>
                                <th className="py-1 px-2 text-right border-r border-gray-300 w-16">Miktar</th>
                                <th className="py-1 px-2 text-right border-r border-gray-300 w-20">Birim Fiyat</th>
                                <th className="py-1 px-2 text-right border-r border-gray-300 w-20">Mal Hizmet Tutarı</th>
                                <th className="py-1 px-2 text-center border-r border-gray-300 w-12">KDV Oranı</th>
                                <th className="py-1 px-2 text-right w-20">KDV Tutarı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => {
                                const taxRate = item.taxRate || 20;
                                const itemTotalKurus = toKurus(item.totalPrice);
                                const taxAmountKurus = Math.round((itemTotalKurus * taxRate) / (100 + taxRate));
                                const exTaxTotalKurus = itemTotalKurus - taxAmountKurus;
                                const exTaxUnitKurus = item.quantity > 0 ? Math.round(exTaxTotalKurus / item.quantity) : 0;

                                return (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="py-1 px-2 text-center border-r border-gray-200">{index + 1}</td>
                                        <td className="py-1 px-2 border-r border-gray-200">PROD-{index + 100}</td>
                                        <td className="py-1 px-2 border-r border-gray-200">{item.productName}</td>
                                        <td className="py-1 px-2 text-right border-r border-gray-200">{item.quantity} Adet</td>
                                        <td className="py-1 px-2 text-right border-r border-gray-200">{fromKurus(exTaxUnitKurus).toFixed(2)} TRY</td>
                                        <td className="py-1 px-2 text-right border-r border-gray-200">{fromKurus(exTaxTotalKurus).toFixed(2)} TRY</td>
                                        <td className="py-1 px-2 text-center border-r border-gray-200">%{taxRate.toFixed(2)}</td>
                                        <td className="py-1 px-2 text-right">{fromKurus(taxAmountKurus).toFixed(2)} TRY</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                
                <div className="flex gap-4 mt-2">
                    
                    <div className="w-2/3 pr-4 flex flex-col justify-between">
                        <div>
                            
                            <div className="h-12 w-64 bg-black mb-1 pattern-lines">
                                
                                <div className="w-full h-full bg-repeating-linear-gradient-90 from-black to-white" style={{ background: "repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)" }}></div>
                            </div>
                            <p className="font-mono text-[10px] mb-4">{invoice.id}</p>

                            <p className="font-bold text-xs uppercase mb-1">*{numberToTurkishText(invoice.totalAmount)}*</p>

                            <div className="text-[9px] mt-2 space-y-1 text-gray-700">
                                <p>*{invoice.order.orderNumber} nolu sipariş faturası</p>
                                <p>*İrsaliye yerine geçer.</p>
                                <p>*İşletme Merkezi: İstanbul</p>
                                <p>*Bu satış internet üzerinden yapılmıştır.</p>
                                <p>*Ürün iadesi ve değişimi için kesinlikle ürünün faturası veya irsaliyesiyle birlikte başvurulması gerekmektedir.</p>
                                <p>*İşbu faturanin tanziminde yapılan herhangi bir hatadan mütevellit haklarımız mahfuzdur.</p>
                            </div>
                        </div>

                        
                        <div className="mt-4 text-[9px] flex gap-8">
                            <div>
                                <span className="font-bold underline block mb-1">BANKA BİLGİLERİ</span>
                                <div className="grid grid-cols-[60px_1fr] gap-x-2">
                                    <span>Garanti</span>
                                    <span>TR00 0000 0000 0000 0000 0000 00</span>
                                    <span>Yapı Kredi</span>
                                    <span>TR00 0000 0000 0000 0000 0000 00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    
                    <div className="w-1/3">
                        <table className="w-full text-xs border border-gray-300">
                            <tbody>
                                <tr>
                                    <td className="p-1 border-b border-gray-300">Mal Hizmet Toplam Tutar:</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">{(invoice.subtotal).toFixed(2)} TRY</td>
                                </tr>
                                <tr>
                                    <td className="p-1 border-b border-gray-300">Vergi Hariç Tutar:</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">{(invoice.subtotal).toFixed(2)} TRY</td>
                                </tr>
                                <tr>
                                    <td className="p-1 border-b border-gray-300">Hesaplanan KDV (%20):</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">{invoice.taxAmount.toFixed(2)} TRY</td>
                                </tr>
                                
                                {invoice.shippingCost > 0 && (
                                    <tr>
                                        <td className="p-1 border-b border-gray-300">Kargo:</td>
                                        <td className="p-1 text-right font-bold border-b border-gray-300 border-l">{invoice.shippingCost.toFixed(2)} TRY</td>
                                    </tr>
                                )}
                                <tr className="bg-gray-100">
                                    <td className="p-1 font-bold border-b border-gray-300">Vergiler Dahil Toplam Tutar:</td>
                                    <td className="p-1 text-right font-bold border-b border-gray-300 border-l">{invoice.totalAmount.toFixed(2)} TRY</td>
                                </tr>
                                <tr className="bg-gray-100">
                                    <td className="p-1 font-bold">Ödenecek Tutar:</td>
                                    <td className="p-1 text-right font-bold border-l">{invoice.totalAmount.toFixed(2)} TRY</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                
                <div className="mt-8 border-t border-b border-gray-300 py-1 text-[10px]">
                    <div className="grid grid-cols-4 gap-2 font-bold text-center uppercase">
                        <div>Ödeme Şekli/Aracısı</div>
                        <div>Taşıyıcı Adı</div>
                        <div>Taşıyıcı VKN/TCKN</div>
                        <div>Gönderim Tarihi</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mt-1 uppercase">
                        <div>KREDI KARTI / IYZICO</div>
                        <div>ARAS KARGO</div>
                        <div>0720039666</div>
                        <div>{invoice.issuedAt ? format(new Date(invoice.issuedAt), "dd.MM.yyyy", { locale: tr }) : "-"}</div>
                    </div>
                </div>

                <div className="flex justify-between mt-1 text-[10px] font-bold uppercase">
                    <div className="w-1/2 text-center">MALI İADE EDEN</div>
                    <div className="w-1/2 text-center">İADE EDİLEN</div>
                </div>
                <div className="flex justify-between mt-8 text-[10px]">
                    <div className="w-1/2 px-4 space-y-1">
                        <p>Adı Soyadı: .......................................</p>
                        <p>Adresi: ............................................</p>
                        <p className="mt-4">İmza: ............................................</p>
                    </div>
                    <div className="w-1/2 px-4 space-y-1 text-right">
                        <div className="flex justify-end gap-2"><span className="w-20 text-left">Cinsi:</span> <span className="w-32 border-b border-gray-300"></span></div>
                        <div className="flex justify-end gap-2"><span className="w-20 text-left">Miktar:</span> <span className="w-32 border-b border-gray-300"></span></div>
                        <div className="flex justify-end gap-2"><span className="w-20 text-left">Birim Fiyat:</span> <span className="w-32 border-b border-gray-300"></span></div>
                        <div className="flex justify-end gap-2"><span className="w-20 text-left">Tutar:</span> <span className="w-32 border-b border-gray-300"></span></div>
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

