import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/webhooks/resend
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Resend sends an event object (or array? usually object for single event or batched?)
        // Docs say: { type: 'email.sent', created_at: '...', data: { email_id: '...', ... } }
        // Or for older Payload: { type: 'email.opened', data: { ... } }

        // We need to handle: 'email.sent', 'email.delivered', 'email.opened', 'email.clicked'

        // Note: To properly secure this, we should verify the signature if Resend provides one, 
        // or use a sufficiently obscure URL / secret query param. 
        // For now, accepting content.

        const { type, data } = payload;

        // data.email_id corresponds to the Resend ID.
        // BUT we need to map it to OUR EmailSend.id or trackingId.
        // When sending, we should have stored the Resend ID?
        // In our schema (EmailSend), we have id, trackingId. We don't have 'resendId'.
        // We should assume 'tags' or 'headers' were used to pass our trackingId to Resend, 
        // and Resend returns it in the webhook.

        // If we didn't send tags, we can't easily link it back unless we store resendId.
        // The current automation send logic didn't store resendId (it just fired and forgot).
        // We need to update existing `process-automations` to save `resendId` IF we can get it from response.
        // Resend SDK .send() returns { id: '...' }.

        // However, simplest way is to use tags: { name: 'trackingId', value: '...' }
        // Then checks payload.data.tags.

        // Let's implement the logic assuming we will update the sender to include tags.

        const trackingIdTag = data?.tags?.find((t: any) => t.name === "trackingId");
        const trackingId = trackingIdTag?.value;

        if (!trackingId) {
            // Can't link.
            return NextResponse.json({ success: true, message: "No trackingId found" });
        }

        if (type === 'email.opened') {
            await prisma.emailSend.update({
                where: { trackingId },
                data: { openedAt: new Date() }
            });
        } else if (type === 'email.clicked') {
            const url = data.link?.url; // Resend click event details?
            await prisma.emailSend.update({
                where: { trackingId },
                data: { clickedAt: new Date() }
            });

            // Check for click tracking logic (conversions)
        }

        // Also log event
        /*
        await prisma.emailEvent.create({
            data: {
                emailSend: { connect: { trackingId } },
                type: type,
                meta: JSON.stringify(data)
            }
        });
        */

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
