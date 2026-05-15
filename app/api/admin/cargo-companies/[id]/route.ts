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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data: { name?: string; code?: string; trackingUrl?: string | null; isActive?: boolean } = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.code !== undefined) {
      const code = normalizeCode(body.code);
      if (!code) {
        return NextResponse.json(
          { error: "CODE_INVALID", message: "Kod yalnızca küçük harf, rakam ve tire içerebilir." },
          { status: 400 }
        );
      }
      data.code = code;
    }

    if (body.trackingUrl !== undefined) {
      data.trackingUrl =
        typeof body.trackingUrl === "string" && body.trackingUrl.trim()
          ? body.trackingUrl.trim()
          : null;
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });
    }

    const updated = await prisma.cargoCompany.update({
      where: { id },
      data,
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json({ company: updated });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json({ error: "CODE_EXISTS" }, { status: 409 });
    }
    console.error("cargo-companies PATCH", e);
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
    }

    const usage = await prisma.order.count({ where: { cargoCompanyId: id } });
    if (usage > 0) {
      return NextResponse.json(
        { error: "IN_USE", message: "Bu firmaya bağlı siparişler var; silmek yerine pasifleştirin." },
        { status: 409 }
      );
    }

    await prisma.cargoCompany.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("cargo-companies DELETE", e);
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
