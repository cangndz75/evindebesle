import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
// import { sendEmail } from "@/lib/resend";

// POST: Kampanyayı gönder
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await req.json();

    // TODO: Kampanyayı render et
    // TODO: Alıcı listesini al
    // TODO: Her alıcı için kişiselleştirilmiş email gönder
    // TODO: Gönderim kayıtlarını tut

    return NextResponse.json({
      success: true,
      message: "Campaign sent",
      sentCount: 0, // Gerçek gönderim sayısı
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
