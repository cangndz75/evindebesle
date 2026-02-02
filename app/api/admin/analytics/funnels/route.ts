import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: List all funnels
export async function GET() {
    try {
        const funnels = await prisma.funnel.findMany({
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ funnels }, { status: 200 });
    } catch (error) {
        console.error('Error fetching funnels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch funnels' },
            { status: 500 }
        );
    }
}

// POST: Create new funnel
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, steps } = body;

        if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
            return NextResponse.json(
                { error: 'Invalid funnel data' },
                { status: 400 }
            );
        }

        const funnel = await prisma.funnel.create({
            data: {
                name,
                description,
                steps: {
                    create: steps.map((step: any, index: number) => ({
                        stepOrder: index + 1,
                        eventType: step.eventType,
                        name: step.name,
                    })),
                },
            },
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
        });

        return NextResponse.json({ funnel }, { status: 201 });
    } catch (error) {
        console.error('Error creating funnel:', error);
        return NextResponse.json(
            { error: 'Failed to create funnel' },
            { status: 500 }
        );
    }
}
