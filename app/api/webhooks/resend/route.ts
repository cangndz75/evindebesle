import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();




        const { type, data } = payload;





        const trackingIdTag = data?.tags?.find((t: any) => t.name === "trackingId");
        const trackingId = trackingIdTag?.value;

        if (!trackingId) {
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

        }


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
