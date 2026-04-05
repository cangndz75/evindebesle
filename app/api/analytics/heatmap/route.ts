import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            page,
            elementId,
            xPercent,
            yPercent,
            sessionId,
            device,
            userId,
        } = body;

        if (!page || xPercent === undefined || yPercent === undefined || !sessionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await prisma.heatmapClick.create({
            data: {
                page,
                elementId: elementId || null,
                xPercent,
                yPercent,
                sessionId,
                device: device || null,
                userId: userId || null,
                timestamp: new Date(),
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error recording heatmap click:', error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get('page');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const device = searchParams.get('device');

        if (!page) {
            return NextResponse.json(
                { error: 'Page parameter required' },
                { status: 400 }
            );
        }

        const whereConditions: any = { page };

        if (startDate && endDate) {
            whereConditions.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (device) {
            whereConditions.device = device;
        }

        const clicks = await prisma.heatmapClick.findMany({
            where: whereConditions,
            select: {
                xPercent: true,
                yPercent: true,
                elementId: true,
                timestamp: true,
            },
        });

        return NextResponse.json({ clicks, count: clicks.length }, { status: 200 });
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch heatmap data' },
            { status: 500 }
        );
    }
}
