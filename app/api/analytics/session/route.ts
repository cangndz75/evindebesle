import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST: Create or update analytics session
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            sessionId,
            device,
            browser,
            referrer,
            landingPage,
            userId,
        } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing sessionId' },
                { status: 400 }
            );
        }

        // Check if session already exists
        const existing = await prisma.analyticsSession.findUnique({
            where: { sessionId },
        });

        if (existing) {
            // Update existing session
            await prisma.analyticsSession.update({
                where: { sessionId },
                data: {
                    userId: userId || existing.userId,
                },
            });
        } else {
            // Create new session
            await prisma.analyticsSession.create({
                data: {
                    sessionId,
                    userId: userId || null,
                    device,
                    browser,
                    referrer,
                    landingPage,
                    startedAt: new Date(),
                },
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

// POST to /session-end: Mark session as ended
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        await prisma.analyticsSession.update({
            where: { sessionId },
            data: {
                endedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error ending session:', error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}
