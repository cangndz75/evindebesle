import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { fromKurus, sumKurus, toKurus } from "@/lib/utils/money";
import { randomUUID } from "crypto";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";

const DEFAULT_TCKN_VKN = "11111111111";
const DEFAULT_INVOICE_PREFIX = "DRK";
const VAT_RATE = 20;

function buildGibInvoiceNumber(year: number, sequence: number): string {
    return `${DEFAULT_INVOICE_PREFIX}${year}${sequence.toString().padStart(9, "0")}`;
}

function toExTaxKurusFromGross(grossKurus: number): number {
    return Math.round((grossKurus * 100) / (100 + VAT_RATE));
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session || !session.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const invoiceNumber = searchParams.get("invoiceNumber");
        const status = searchParams.get("status");

        const where: any = {};
        if (invoiceNumber) {
            where.invoiceNumber = { contains: invoiceNumber, mode: "insensitive" };
        }
        if (status && status !== "all") {
            where.status = status;
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("[INVOICES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session || !session.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return new NextResponse("Order ID is required", { status: 400 });
        }

        const existingInvoice = await prisma.invoice.findFirst({
            where: { orderId }
        });

        if (existingInvoice) {
            return new NextResponse("Invoice already exists for this order", { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                },
                shippingAddress: {
                    include: {
                        district: true
                    }
                },
                billingAddress: {
                    include: {
                        district: true
                    }
                }
            }
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        const companySettings = withDefaultCompanyProfile(await prisma.companySettings.findFirst());

        const year = new Date().getFullYear();
        const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
        const nextYearStart = new Date(`${year + 1}-01-01T00:00:00.000Z`);
        const countForYear = await prisma.invoice.count({
            where: {
                createdAt: {
                    gte: yearStart,
                    lt: nextYearStart,
                },
            },
        });
        const invoiceNumber = buildGibInvoiceNumber(year, countForYear + 1);

        const customerAddress = order.billingAddress || order.shippingAddress;
        const districtName = customerAddress?.district?.name || "";
        const cityName = customerAddress?.district?.city || "";
        const addressLine = customerAddress?.fullAddress || "";
        const fullAddressText = [districtName, cityName, addressLine].filter(Boolean).join(" ").trim();

        const rawTaxNumber = (order.user as any)?.taxNumber || (customerAddress as any)?.taxNumber;
        const taxNumber = String(rawTaxNumber || DEFAULT_TCKN_VKN);
        const ettn = randomUUID().replaceAll("-", "");

        const customerSnapshot = {
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone,
            address: customerAddress,
            addressText: fullAddressText,
            taxNumber,
            taxOffice: (order.user as any)?.taxOffice || "-",
            ettn,
        };

        const itemsSnapshot = order.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            taxRate: VAT_RATE,
        }));

        const itemGrossKurus = sumKurus(order.items.map((item: any) => item.totalPrice));
        const itemNetKurus = toExTaxKurusFromGross(itemGrossKurus);
        const itemTaxKurus = itemGrossKurus - itemNetKurus;

        const totalAmount = fromKurus(toKurus(order.total));
        const taxAmount = fromKurus(itemTaxKurus);
        const netAmount = fromKurus(itemNetKurus);

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                orderId: order.id,
                status: "ISSUED",
                companyDetails: companySettings || {},
                customerDetails: customerSnapshot,
                items: itemsSnapshot,
                subtotal: netAmount,
                taxAmount,
                totalAmount,
                issuedAt: new Date(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
            }
        });

        return NextResponse.json(invoice);

    } catch (error) {
        console.error("[INVOICES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
