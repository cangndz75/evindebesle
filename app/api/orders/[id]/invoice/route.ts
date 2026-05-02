import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import puppeteer from "puppeteer";
import { renderInvoiceHTML } from "@/lib/invoice/renderInvoiceHTML";
import { toInvoiceDTO } from "@/lib/api/dto/order";
import { jsonNoStore } from "@/lib/api/policy";
import QRCode from "qrcode";
import { buildGibQrContent, formatQrIssueDate, resolveInvoiceEttn } from "@/lib/invoice/qr";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";

export const dynamic = "force-dynamic";

const VAT_RATE = 20;
const DEFAULT_TAX_NUMBER = "11111111111";

function buildFallbackCustomer(order: any) {
    const customerAddress = order.billingAddress || order.shippingAddress;
    const districtName = customerAddress?.district?.name || "";
    const cityName = customerAddress?.district?.city || "";
    const addressLine = customerAddress?.fullAddress || "";

    return {
        name: order.user?.name || "-",
        email: order.user?.email || "",
        phone: order.user?.phone || "",
        taxOffice: "-",
        taxNumber: DEFAULT_TAX_NUMBER,
        addressText: [districtName, cityName, addressLine].filter(Boolean).join(" ").trim(),
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        color: { select: { name: true } },
                        size: { select: { name: true } },
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                shippingAddress: {
                    include: {
                        district: true,
                    },
                },
                billingAddress: {
                    include: {
                        district: true,
                    },
                },
            },
        });

        if (!order) {
            return jsonNoStore({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== user.id && !user.isAdmin) {
            return jsonNoStore({ error: "Forbidden" }, { status: 403 });
        }

        if (order.paymentStatus !== "PAID" && order.paymentStatus !== "SUCCEEDED") {
            return jsonNoStore(
                { error: "Invoice only available for paid orders" },
                { status: 400 }
            );
        }

        const companySettings = withDefaultCompanyProfile(await prisma.companySettings.findFirst());

        const invoiceRecord = await prisma.invoice.findFirst({
            where: { orderId: order.id },
            orderBy: { createdAt: "desc" },
        });

        const orderDto = toInvoiceDTO(order);

        const items = Array.isArray((invoiceRecord?.items as any[] | undefined))
            ? (invoiceRecord?.items as any[])
            : orderDto.items.map((item: any) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  taxRate: VAT_RATE,
              }));

        const subtotal = typeof invoiceRecord?.subtotal === "number" ? invoiceRecord.subtotal : orderDto.subtotal;
        const taxAmount = typeof invoiceRecord?.taxAmount === "number" ? invoiceRecord.taxAmount : orderDto.subtotal * (VAT_RATE / 100);
        const totalAmount = typeof invoiceRecord?.totalAmount === "number" ? invoiceRecord.totalAmount : orderDto.total;

        const customerDetails =
            invoiceRecord?.customerDetails && typeof invoiceRecord.customerDetails === "object"
                ? (invoiceRecord.customerDetails as Record<string, unknown>)
                : buildFallbackCustomer(order);

        const companyDetails =
            invoiceRecord?.companyDetails && typeof invoiceRecord.companyDetails === "object"
            ? withDefaultCompanyProfile(invoiceRecord.companyDetails)
            : (companySettings as Record<string, unknown>);

        const invoicePayload = {
            invoiceNumber: invoiceRecord?.invoiceNumber || `SIP-${order.orderNumber}`,
            ettn: resolveInvoiceEttn({
                invoiceId: invoiceRecord?.id || order.id,
                customerDetails,
                companyDetails,
            }),
            issuedAt: invoiceRecord?.issuedAt || order.paidAt || order.createdAt,
            dueDate: invoiceRecord?.dueDate || null,
            scenario: "EARSIVFATURA",
            type: "SATIS",
            customizationNo: "TR1.2",
            subtotal,
            taxAmount,
            totalAmount,
            items,
            customerDetails,
        };

        const sellerTaxId =
            String((companyDetails as Record<string, unknown>)?.taxNumber || "").trim() || DEFAULT_TAX_NUMBER;
        const issueDate = formatQrIssueDate(invoicePayload.issuedAt);
        const qrContent = buildGibQrContent({
            sellerTaxId,
            invoiceNumber: invoicePayload.invoiceNumber,
            ettn: invoicePayload.ettn,
            issueDate,
            payableAmount: invoicePayload.totalAmount,
        });

        const qrDataUrl = await QRCode.toDataURL(qrContent, {
            margin: 1,
            width: 180,
            errorCorrectionLevel: "M",
        });

        const html = renderInvoiceHTML({
            order: orderDto,
            invoice: invoicePayload,
            company: companyDetails || {
                companyName: "CIHAN MERT OZCAN",
                companyAddress: "YUNUS MAH. ERSIN SK NO:8/3 KARTAL ISTANBUL",
                taxOffice: "KARTAL VERGI DAIRESI MUD",
                taxNumber: "1063374910",
                phone: "5356818375",
                email: "info@dark-velvet.com",
                logoUrl: "",
                website: "https://www.dark-velvet.com",
            },
            qrDataUrl,
        });

        console.log("Starting debug invoice generation...");
        let browser;
        try {
            console.log("Launching puppeteer...");
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage", // Add this to prevent memory issues in some envs
                    "--disable-gpu"
                ],
            });
            console.log("Puppeteer launched successfully.");

            const page = await browser.newPage();
            console.log("New page created.");

            await page.setContent(html, { waitUntil: "networkidle0" });
            console.log("Content set.");

            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: {
                    top: "20mm",
                    right: "15mm",
                    bottom: "20mm",
                    left: "15mm",
                },
            });
            console.log("PDF generated successfully.");

            await browser.close();
            console.log("Browser closed.");

            return new NextResponse(Buffer.from(pdf), {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="fatura-${order.orderNumber}.pdf"`,
                },
            });
        } catch (puppeteerError) {
            console.error("Puppeteer specific error:", puppeteerError);
            if (browser) await browser.close();
            throw puppeteerError; // Re-throw to be caught by outer catch
        }
    } catch (error: any) {
        console.error("Invoice generation error", { name: error?.name });

        return jsonNoStore(
            { error: "INVOICE_GENERATION_EXCEPTION" },
            { status: 500 }
        );
    }
}
