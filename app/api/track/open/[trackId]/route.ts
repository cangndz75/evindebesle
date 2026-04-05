import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ trackId: string }> }
) {
    try {
        const { trackId } = await params;

        const emailSend = await prisma.emailSend.findUnique({
            where: { trackingId: trackId },
        });

        if (emailSend) {
            if (!emailSend.openedAt) {
                await prisma.emailSend.update({
                    where: { id: emailSend.id },
                    data: { openedAt: new Date() },
                });
            }

            await prisma.emailEvent.create({
                data: {
                    emailSendId: emailSend.id,
                    type: "open",
                    userAgent: req.headers.get("user-agent") || undefined,
                    ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
                },
            });
        }

        const transparentGif = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );

        return new NextResponse(transparentGif, {
            headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });
    } catch (error) {
        console.error("Error tracking email open:", error);

        const transparentGif = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );

        return new NextResponse(transparentGif, {
            headers: {
                "Content-Type": "image/gif",
            },
        });
    }
}
