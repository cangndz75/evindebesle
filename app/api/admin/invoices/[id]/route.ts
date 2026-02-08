import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authConfig);

        if (!session || !session.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true,
                            }
                        },
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                    }
                                },
                                color: {
                                    select: {
                                        name: true,
                                    }
                                },
                                size: {
                                    select: {
                                        name: true,
                                    }
                                }
                            }
                        },
                        shippingAddress: {
                            include: {
                                district: true,
                            }
                        },
                        billingAddress: {
                            include: {
                                district: true,
                            }
                        },
                        coupon: {
                            select: {
                                code: true,
                                discountType: true,
                                value: true,
                            }
                        }
                    }
                }
            }
        });

        if (!invoice) {
            return new NextResponse("Invoice not found", { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("[INVOICE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authConfig);

        if (!session || !session.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { status, notes } = body;

        const invoice = await prisma.invoice.update({
            where: { id: params.id },
            data: {
                ...(status && { status }),
                ...(notes && { notes }),
            }
        });

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("[INVOICE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authConfig);

        if (!session || !session.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.invoice.delete({
            where: { id: params.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[INVOICE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
