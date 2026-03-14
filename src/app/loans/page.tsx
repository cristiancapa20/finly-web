import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoansClient from "@/components/LoansClient";

export default async function LoansPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Préstamos y Deudas</h1>
      <LoansClient />
    </div>
  );
}
