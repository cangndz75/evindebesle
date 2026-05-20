import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const svixId = req.headers.get("svix-id");
        const svixTimestamp = req.headers.get("svix-timestamp");
        const svixSignature = req.headers.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
        }

        const rawBody = await req.text();
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();

        if (!webhookSecret) {
            console.error("CRITICAL: RESEND_WEBHOOK_SECRET environment variable is missing");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const wh = new Webhook(webhookSecret);
        let evt: { type?: string; data?: Record<string, unknown> };

        try {
            evt = wh.verify(rawBody, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            }) as { type?: string; data?: Record<string, unknown> };
        } catch (err) {
            console.error("Resend webhook signature verification failed:", err);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const { type, data } = evt;
        const tags = Array.isArray(data?.tags) ? data.tags : [];
        const trackingIdTag = tags.find(
            (t: unknown) =>
                typeof t === "object" &&
                t !== null &&
                "name" in t &&
                (t as { name?: string }).name === "trackingId"
        ) as { value?: string } | undefined;
        const trackingId = trackingIdTag?.value;

        if (!trackingId) {
            return NextResponse.json({ success: true, message: "No trackingId found" });
        }

        if (type === "email.opened") {
            await prisma.emailSend.update({
                where: { trackingId },
                data: { openedAt: new Date() },
            });
        } else if (type === "email.clicked") {
            await prisma.emailSend.update({
                where: { trackingId },
                data: { clickedAt: new Date() },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
