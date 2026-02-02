import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST: Track analytics event
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            sessionId,
            eventType,
            eventData,
            page,
            referrer,
            timestamp,
        } = body;

        if (!sessionId || !eventType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user ID from session if available
        let userId: string | null = null;
        const session = await prisma.analyticsSession.findUnique({
            where: { sessionId },
            select: { userId: true },
        });
        userId = session?.userId || null;

        // Extract IP and user agent from headers
        const ipAddress =
            req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            null;
        const userAgent = req.headers.get('user-agent') || null;

        // Create analytics event
        await prisma.analyticsEvent.create({
            data: {
                sessionId,
                userId,
                eventType,
                eventData: eventData || {},
                page,
                referrer,
                ipAddress,
                userAgent,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error tracking event:', error);
        // Don't return error details to client - just log and return 200
        // This prevents analytics failures from affecting user experience
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

// GET: Get recent events (for debugging/admin)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const eventType = searchParams.get('eventType');

        const events = await prisma.analyticsEvent.findMany({
            where: eventType ? { eventType } : undefined,
            take: limit,
            orderBy: { timestamp: 'desc' },
            select: {
                id: true,
                eventType: true,
                eventData: true,
                page: true,
                timestamp: true,
                userId: true,
            },
        });

        return NextResponse.json({ events }, { status: 200 });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
