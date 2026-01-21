import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";
import CompanySettingsClient from "./_components/CompanySettingsClient";

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect("/");
  }

  return <CompanySettingsClient />;
}
