import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoansPageClient from "@/components/LoansPageClient";

export default async function LoansPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Compromisos</h1>
      <LoansPageClient />
    </div>
  );
}
