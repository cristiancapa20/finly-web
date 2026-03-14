import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TransactionForm from "@/components/TransactionForm";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Nueva transacción
      </h1>
      <TransactionForm />
    </div>
  );
}
