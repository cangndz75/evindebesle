import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const campaignId = url.searchParams.get("campaignId");
        const originalUrl = url.searchParams.get("url");
        const trackingId = url.searchParams.get("trackingId"); // Optional: specific email send

        if (!originalUrl) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        const decodedUrl = decodeURIComponent(originalUrl);

        // Open redirect koruması: sadece kendi domain'e yönlendir
        const ALLOWED_HOSTS = [
          "dark-velvet.com",
          "www.dark-velvet.com",
          "evindebesle.com",
          "www.evindebesle.com",
        ];
        let safeRedirectUrl: string;
        try {
          const parsed = new URL(decodedUrl);
          if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
            return NextResponse.redirect(new URL("/", req.url));
          }
          safeRedirectUrl = parsed.toString();
        } catch {
          return NextResponse.redirect(new URL("/", req.url));
        }

        if (campaignId) {
            try {
                let emailLink = await prisma.emailLink.findFirst({
                    where: {
                        campaignId,
                        originalUrl: decodedUrl,
                    },
                });

                if (!emailLink) {
                    emailLink = await prisma.emailLink.create({
                        data: {
                            campaignId,
                            originalUrl: decodedUrl,
                        },
                    });
                }

                await prisma.emailLink.update({
                    where: { id: emailLink.id },
                    data: { clickCount: { increment: 1 } },
                });

                if (trackingId) {
                    const emailSend = await prisma.emailSend.findUnique({
                        where: { trackingId },
                    });

                    if (emailSend) {
                        if (!emailSend.clickedAt) {
                            await prisma.emailSend.update({
                                where: { id: emailSend.id },
                                data: { clickedAt: new Date() },
                            });
                        }

                        await prisma.emailEvent.create({
                            data: {
                                emailSendId: emailSend.id,
                                type: "click",
                                linkUrl: decodedUrl,
                                linkId: emailLink.id,
                                userAgent: req.headers.get("user-agent") || undefined,
                                ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
                            },
                        });
                    }
                }
            } catch (trackError) {
                console.error("Error tracking click:", trackError);
            }
        }

        return NextResponse.redirect(safeRedirectUrl);
    } catch (error) {
        console.error("Error in click tracking:", error);
        return NextResponse.redirect(new URL("/", req.url));
    }
}
