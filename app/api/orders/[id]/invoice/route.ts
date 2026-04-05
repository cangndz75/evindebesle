import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import puppeteer from "puppeteer";
import { renderInvoiceHTML } from "@/lib/invoice/renderInvoiceHTML";
import { toInvoiceDTO } from "@/lib/api/dto/order";
import { jsonNoStore } from "@/lib/api/policy";

export const dynamic = "force-dynamic";

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

        const companySettings = await prisma.companySettings.findFirst();

        const html = renderInvoiceHTML({
            order: toInvoiceDTO(order),
            company: companySettings || {
                companyName: "Dark Velvet",
                companyAddress: "",
                taxOffice: "",
                taxNumber: "",
                phone: "",
                email: "",
                logoUrl: "",
                website: "",
            },
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
