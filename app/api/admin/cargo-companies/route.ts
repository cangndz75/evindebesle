import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const dynamic = "force-dynamic";

function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (!s || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await prisma.cargoCompany.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json({ companies });
  } catch (e) {
    console.error("cargo-companies GET", e);
    return NextResponse.json({ error: "LIST_FAILED" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = normalizeCode(body.code);
    const trackingUrl =
      typeof body.trackingUrl === "string" && body.trackingUrl.trim()
        ? body.trackingUrl.trim()
        : null;
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    if (!name) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json(
        { error: "CODE_INVALID", message: "Kod yalnızca küçük harf, rakam ve tire içerebilir." },
        { status: 400 }
      );
    }

    const created = await prisma.cargoCompany.create({
      data: { name, code, trackingUrl, isActive },
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json({ company: created });
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    if (msg === "P2002") {
      return NextResponse.json({ error: "CODE_EXISTS" }, { status: 409 });
    }
    console.error("cargo-companies POST", e);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }
}
