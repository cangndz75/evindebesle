import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api/policy';

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

        let userId: string | null = null;
        const session = await prisma.analyticsSession.findUnique({
            where: { sessionId },
            select: { userId: true },
        });
        userId = session?.userId || null;

        const ipAddress =
            req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            null;
        const userAgent = req.headers.get('user-agent') || null;

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
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

export async function GET(req: NextRequest) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

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
