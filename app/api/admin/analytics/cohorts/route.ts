import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonNoStore, requireAdmin } from '@/lib/api/policy';

// GET: Cohort analysis
export async function GET(req: NextRequest) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const { searchParams } = new URL(req.url);
        const cohortBy = searchParams.get('cohortBy') || 'registration_date'; // registration_date, first_purchase_date
        const metric = searchParams.get('metric') || 'retention'; // retention, revenue, orders
        const period = searchParams.get('period') || 'weekly'; // weekly, monthly

        const periodDays = period === 'weekly' ? 7 : 30;
        const periodsToShow = 12; // Show last 12 periods

        // Get cohort data
        const now = new Date();
        const startDate = new Date(now.getTime() - periodsToShow * periodDays * 24 * 60 * 60 * 1000);

        // Get all users created in the time range
        const users = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                id: true,
                createdAt: true,
                orders: {
                    select: {
                        id: true,
                        createdAt: true,
                        total: true,
                        status: true,
                    },
                },
            },
        });

        // Group users into cohorts
        const cohorts: Map<string, any[]> = new Map();

        users.forEach((user: typeof users[0]) => {
            const cohortDate = getCohortPeriod(user.createdAt, periodDays);
            const cohortKey = cohortDate.toISOString().split('T')[0];

            if (!cohorts.has(cohortKey)) {
                cohorts.set(cohortKey, []);
            }
            cohorts.get(cohortKey)?.push(user);
        });

        // Build cohort matrix
        const matrix: any[] = [];
        const sortedCohortKeys = Array.from(cohorts.keys()).sort();

        for (const cohortKey of sortedCohortKeys) {
            const cohortUsers = cohorts.get(cohortKey) || [];
            const cohortStartDate = new Date(cohortKey);

            const row: any = {
                cohortDate: cohortKey,
                cohortSize: cohortUsers.length,
                periods: [],
            };

            // For each subsequent period, calculate metric
            for (let periodIndex = 0; periodIndex < periodsToShow; periodIndex++) {
                const periodStart = new Date(cohortStartDate.getTime() + periodIndex * periodDays * 24 * 60 * 60 * 1000);
                const periodEnd = new Date(periodStart.getTime() + periodDays * 24 * 60 * 60 * 1000);

                // Stop if period is in the future
                if (periodStart > now) break;

                let value = 0;

                if (metric === 'retention') {
                    // Count users who had activity in this period
                    const activeUsers = cohortUsers.filter(user => {
                        return user.orders.some((order: any) => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= periodStart && orderDate < periodEnd;
                        });
                    });
                    value = cohortUsers.length > 0
                        ? (activeUsers.length / cohortUsers.length) * 100
                        : 0;
                } else if (metric === 'revenue') {
                    // Sum revenue for this period
                    const revenue = cohortUsers.reduce((sum, user) => {
                        const periodRevenue = user.orders
                            .filter((order: any) => {
                                const orderDate = new Date(order.createdAt);
                                return orderDate >= periodStart && orderDate < periodEnd &&
                                    order.status === 'PAID';
                            })
                            .reduce((orderSum: number, order: any) => orderSum + order.total, 0);
                        return sum + periodRevenue;
                    }, 0);
                    value = cohortUsers.length > 0
                        ? revenue / cohortUsers.length
                        : 0;
                } else if (metric === 'orders') {
                    // Count average orders per user
                    const orderCount = cohortUsers.reduce((sum, user) => {
                        const periodOrders = user.orders.filter((order: any) => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= periodStart && orderDate < periodEnd;
                        });
                        return sum + periodOrders.length;
                    }, 0);
                    value = cohortUsers.length > 0
                        ? orderCount / cohortUsers.length
                        : 0;
                }

                row.periods.push({
                    periodIndex,
                    value: Math.round(value * 100) / 100,
                });
            }

            matrix.push(row);
        }

        return jsonNoStore({
            cohortBy,
            metric,
            period,
            matrix,
        }, { status: 200 });
    } catch (error) {
        console.error('Error generating cohort analysis:', error);
        return jsonNoStore(
            { error: 'Failed to generate cohort analysis' },
            { status: 500 }
        );
    }
}

// Helper function to get cohort period
function getCohortPeriod(date: Date, periodDays: number): Date {
    const daysSinceEpoch = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
    const periodsSinceEpoch = Math.floor(daysSinceEpoch / periodDays);
    const cohortDaySinceEpoch = periodsSinceEpoch * periodDays;
    return new Date(cohortDaySinceEpoch * 24 * 60 * 60 * 1000);
}
