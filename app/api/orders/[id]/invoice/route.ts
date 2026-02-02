import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import puppeteer from "puppeteer";
import { renderInvoiceHTML } from "@/lib/invoice/renderInvoiceHTML";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Sipariş bilgilerini getir
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                        color: true,
                        size: true,
                    },
                },
                user: true,
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
                coupon: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Yetki kontrolü: Sadece sipariş sahibi veya admin
        if (order.userId !== user.id && !user.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Sadece ödeme yapılmış siparişler için fatura
        if (order.paymentStatus !== "PAID" && order.paymentStatus !== "SUCCEEDED") {
            return NextResponse.json(
                { error: "Invoice only available for paid orders" },
                { status: 400 }
            );
        }

        // Şirket bilgilerini getir
        const companySettings = await prisma.companySettings.findFirst();

        // HTML render et
        const html = renderInvoiceHTML({
            order,
            company: companySettings || {
                companyName: "Evindebesle",
                companyAddress: "",
                taxOffice: "",
                taxNumber: "",
                phone: "",
                email: "",
                logoUrl: "",
                website: "",
            },
        });

        // Puppeteer ile PDF oluştur
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

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

        await browser.close();

        // PDF'i döndür - Convert Buffer to Uint8Array for proper type
        return new NextResponse(Buffer.from(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="fatura-${order.orderNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Invoice generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate invoice" },
            { status: 500 }
        );
    }
}
