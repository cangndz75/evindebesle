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

            // PDF'i döndür - Convert Buffer to Uint8Array for proper type
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
        console.error("Invoice generation error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        return NextResponse.json(
            {
                error: "Failed to generate invoice",
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
