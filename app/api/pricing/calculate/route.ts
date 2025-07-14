import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { serviceIds, dates, recurring, recurringType, recurringCount, plan } = body;

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
  });

  let total = 0;

  for (const service of services) {
    if (recurring) {
      if (recurringType === "daily") {
        total += service.price * dates.length;
      } else if (recurringType === "weekly") {
        total += service.price * recurringCount * 7;
      } else if (recurringType === "monthly") {
        total += service.price * recurringCount * 30;
      }
    } else {
      total += service.price * dates.length;
    }
  }

  type Plan = "starter" | "professional" | "enterprise";

  const discountMap: Record<Plan, number> = {
    starter: 0,
    professional: 0.1,
    enterprise: 0.2,
  };

  const planTyped = body.plan as Plan;
  const discountRate = discountMap[planTyped] || 0;

  const discounted = Math.round(total * (1 - discountRate));

  return NextResponse.json({
    original: total,
    discounted,
  });
}
