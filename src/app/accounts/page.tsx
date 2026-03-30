import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";

export default async function CuentasPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Cuentas</h1>
      <SettingsClient />
    </div>
  );
}
