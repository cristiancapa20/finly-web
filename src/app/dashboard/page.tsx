import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import OnboardingModal from "@/components/OnboardingModal";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <OnboardingModal />
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <DashboardClient />
    </div>
  );
}
