import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

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

        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findFirst({
            where: { orderId }
        });

        if (existingInvoice) {
            return new NextResponse("Invoice already exists for this order", { status: 400 });
        }

        // Fetch order details with relations
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

        // Get company settings for snapshot
        const companySettings = await prisma.companySettings.findFirst();

        // Generate Invoice Number (Simple auto-increment logic or timestamp based for now)
        // In a real app, this should be more robust with a separate counter table or sequence.
        const datePart = new Date().getFullYear();
        const count = await prisma.invoice.count();
        const invoiceNumber = `F-${datePart}-${(count + 1).toString().padStart(6, '0')}`;

        // Prepare snapshots
        const customerSnapshot = {
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone,
            address: order.billingAddress || order.shippingAddress,
        };

        const itemsSnapshot = order.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            taxRate: 20, // Assuming 20% VAT for now, ideally comes from product
        }));

        // Calculate details
        const subtotal = order.subtotal;
        // Simple tax calculation (backwards from total or based on subtotal depending on business logic)
        // Here assuming subtotal is tax-exclusive or inclusive? Usually e-commerce DB stores gross.
        // Let's assume order.subtotal is gross for simplicity/consistency with existing logic if any.
        // Re-calculating breakdown:

        // Actually, usually order.total is what user pays.
        // Let's assume 20% VAT included in prices.
        const taxRate = 0.20;
        const totalAmount = order.total;
        const taxAmount = totalAmount - (totalAmount / (1 + taxRate));
        const netAmount = totalAmount - taxAmount;

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                orderId: order.id,
                status: "ISSUED", // Auto-issue
                companyDetails: companySettings || {},
                customerDetails: customerSnapshot,
                items: itemsSnapshot,
                subtotal: netAmount,
                taxAmount: taxAmount,
                totalAmount: totalAmount,
                issuedAt: new Date(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days due
            }
        });

        return NextResponse.json(invoice);

    } catch (error) {
        console.error("[INVOICES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
