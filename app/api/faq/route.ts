import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalizeFaqCategory(raw: string) {
  const value = (raw || "").trim().toLocaleLowerCase("tr-TR");

  if (["order", "siparis", "sipariş"].includes(value)) return "order";
  if (["payment", "odeme", "ödeme"].includes(value)) return "payment";
  if (["shipping", "kargo", "teslimat"].includes(value)) return "shipping";
  if (["return", "iade"].includes(value)) return "return";
  if (["product", "urun", "ürün"].includes(value)) return "product";
  if (["account", "hesap"].includes(value)) return "account";

  return value || "order";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
    const where: any = { isActive: true };
    if (category) {
      where.category = normalizeFaqCategory(category);
    }

    const rawFaqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    const faqs = rawFaqs.map((faq: any) => ({
      ...faq,
      category: normalizeFaqCategory(faq.category),
    }));

    const grouped: Record<string, typeof faqs> = {};
    for (const faq of faqs) {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    }

    return NextResponse.json({ grouped, faqs });
  } catch (error: any) {
    console.error("FAQ fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
