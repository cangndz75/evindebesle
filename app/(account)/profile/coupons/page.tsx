import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { redirect } from "next/navigation";
import CouponsClient from "./_components/CouponsClient";

export default async function CouponsPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return redirect("/login");

  return <CouponsClient />;
}
