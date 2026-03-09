import { TrendingUp, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-indigo-500" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-indigo-600 font-bold text-lg">Finance Tracker</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin conexión</h1>
        <p className="text-gray-500 text-sm mb-8">
          Parece que no tienes conexión a internet. Revisa tu red e intenta de nuevo.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Reintentar
        </Link>
      </div>
    </div>
  );
}
