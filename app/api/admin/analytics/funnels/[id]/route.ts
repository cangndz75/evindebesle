import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

// GET: Get funnel analysis
export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, today

        // Get funnel with steps
        const funnel = await prisma.funnel.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
        });

        if (!funnel) {
            return NextResponse.json(
                { error: 'Funnel not found' },
                { status: 404 }
            );
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Analyze funnel - count users who completed each step
        const analysis = await analyzeFunnel(funnel.steps, startDate, now);

        return NextResponse.json({
            funnel: {
                id: funnel.id,
                name: funnel.name,
                description: funnel.description,
            },
            period,
            startDate,
            endDate: now,
            analysis,
        }, { status: 200 });
    } catch (error) {
        console.error('Error analyzing funnel:', error);
        return NextResponse.json(
            { error: 'Failed to analyze funnel' },
            { status: 500 }
        );
    }
}

// Helper function to analyze funnel steps
async function analyzeFunnel(
    steps: any[],
    startDate: Date,
    endDate: Date
) {
    const results = [];

    // For each step, count unique sessions that completed it
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Get sessions that completed this step
        const sessionsAtThisStep = await prisma.analyticsEvent.findMany({
            where: {
                eventType: step.eventType,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                sessionId: true,
                timestamp: true,
            },
            distinct: ['sessionId'],
        });

        const count = sessionsAtThisStep.length;

        // Calculate conversion rate from previous step
        let conversionRate = 100;
        let dropOffCount = 0;

        if (i > 0) {
            const previousCount = results[i - 1].count;
            conversionRate = previousCount > 0
                ? (count / previousCount) * 100
                : 0;
            dropOffCount = previousCount - count;
        }

        results.push({
            stepOrder: step.stepOrder,
            stepName: step.name,
            eventType: step.eventType,
            count,
            conversionRate: Math.round(conversionRate * 100) / 100,
            dropOffCount,
        });
    }

    return results;
}

// DELETE: Delete funnel
export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        await prisma.funnel.delete({
            where: { id },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting funnel:', error);
        return NextResponse.json(
            { error: 'Failed to delete funnel' },
            { status: 500 }
        );
    }
}
