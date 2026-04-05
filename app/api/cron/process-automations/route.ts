import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            if (process.env.NODE_ENV === "production") {
                return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        const results = {
            triggeredResponse: await checkTriggers(),
            processedFlows: await processActiveFlows(),
        };

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Cron Job Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

async function checkTriggers() {
    const results = {
        welcome: 0,
        abandonedCart: 0,
    };

    try {
        const welcomeAutomation = await prisma.automation.findFirst({
            where: { triggerType: "WELCOME", isActive: true },
        });

        if (welcomeAutomation) {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const newUsers = await prisma.user.findMany({
                where: {
                    createdAt: { gte: oneDayAgo },
                    userAutomations: {
                        none: { automationId: welcomeAutomation.id },
                    },
                },
                select: { id: true },
                take: 100, // Batch limit
            });

            if (newUsers.length > 0) {
                await prisma.userAutomation.createMany({
                    data: newUsers.map((u: { id: string }) => ({
                        userId: u.id,
                        automationId: welcomeAutomation.id,
                        status: "ACTIVE",
                        currentStep: 0,
                    })),
                });
                results.welcome = newUsers.length;
            }
        }

        const cartAutomation = await prisma.automation.findFirst({
            where: { triggerType: "ABANDONED_CART", isActive: true },
        });

        if (cartAutomation) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const candidateUsers = await prisma.user.findMany({
                where: {
                    cartItems: {
                        some: {
                            updatedAt: { gte: twentyFourHoursAgo, lte: oneHourAgo }
                        }
                    },
                    userAutomations: {
                        none: {
                            automationId: cartAutomation.id,
                            status: { in: ["ACTIVE", "COMPLETED"] },
                            startedAt: { gte: twentyFourHoursAgo }
                        }
                    }
                },
                include: {
                    orders: {
                        where: { createdAt: { gte: oneHourAgo } } // Check if ordered recently
                    }
                },
                take: 50
            });

            const usersToTrigger = candidateUsers.filter((u: any) => u.orders.length === 0);

            if (usersToTrigger.length > 0) {
                await prisma.userAutomation.createMany({
                    data: usersToTrigger.map((u: any) => ({
                        userId: u.id,
                        automationId: cartAutomation.id,
                        status: "ACTIVE",
                        currentStep: 0,
                    })),
                });
                results.abandonedCart = usersToTrigger.length;
            }
        }

    } catch (e) {
        console.error("Error checking triggers", e);
    }

    return results;
}

async function processActiveFlows() {
    let processedCount = 0;

    const activeFlows = await prisma.userAutomation.findMany({
        where: { status: "ACTIVE" },
        include: {
            automation: {
                include: { steps: { orderBy: { order: "asc" }, include: { template: true } } }
            },
            user: true
        },
        take: 50 // Limit per run
    });

    for (const flow of activeFlows) {
        const steps = flow.automation.steps;
        const currentStepIndex = flow.currentStep;

        if (currentStepIndex >= steps.length) {
            await prisma.userAutomation.update({
                where: { id: flow.id },
                data: { status: "COMPLETED" }
            });
            continue;
        }

        const step = steps[currentStepIndex];
        const now = new Date();
        const lastStepTime = new Date(flow.lastStepTime);

        let shouldAdvance = false;

        if (step.type === "DELAY") {
            const delayMs = (step.delaySeconds || 0) * 1000;
            if (now.getTime() - lastStepTime.getTime() >= delayMs) {
                shouldAdvance = true;
            }
        } else if (step.type === "EMAIL") {
            if (step.template) {
                try {
                    const campaignId = `automation-${flow.automation.id}`;


                    const emailSend = await prisma.emailSend.create({
                        data: {
                            campaign: {
                                connectOrCreate: {
                                    where: { id: campaignId },
                                    create: {
                                        id: campaignId,
                                        name: flow.automation.name,
                                        status: "sending", // Special status
                                        createdById: flow.user.id, // Linking to user receiving it? No, needs Admin. 
                                    }
                                }
                            },
                            userId: flow.userId,
                            email: flow.user.email,
                            status: "sent",
                        }
                    });

                    const html = step.template.bodyJson; // Needs parsing/rendering logic ideally

                    await resend.emails.send({
                        from: "Dark Velvet <info@dark-velvet.com>",
                        to: flow.user.email,
                        subject: step.template.subject,
                        html: html || "<p>Hello</p>",
                        tags: [
                            { name: "trackingId", value: emailSend.trackingId },
                            { name: "automationId", value: flow.automation.id }
                        ]
                    });

                    shouldAdvance = true;

                } catch (e) {
                    console.error("Failed to send automation email", e);
                }
            } else {
                shouldAdvance = true; // Skip empty steps
            }
        }

        if (shouldAdvance) {
            await prisma.userAutomation.update({
                where: { id: flow.id },
                data: {
                    currentStep: currentStepIndex + 1,
                    lastStepTime: new Date()
                }
            });
            processedCount++;
        }
    }

    return processedCount;
}
