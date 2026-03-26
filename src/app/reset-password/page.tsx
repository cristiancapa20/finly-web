"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, TrendingUp, Check, X } from "lucide-react";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const passwordRules: Rule[] = [
  { label: "Mínimo 6 caracteres", test: (v) => v.length >= 6 },
  { label: "Al menos una letra", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "Al menos un número", test: (v) => /\d/.test(v) },
];

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));
  const confirmMatch = confirm.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("La contraseña no cumple los requisitos.");
      return;
    }

    if (!confirmMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error, intenta de nuevo.");
      } else {
        setDone(true);
        setTimeout(() => router.replace("/login"), 3000);
      }
    } catch {
      setError("Ocurrió un error, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Enlace inválido</h2>
        <p className="text-sm text-gray-500">El enlace no es válido o ya expiró.</p>
        <Link href="/forgot-password" className="text-sm text-indigo-600 font-medium hover:underline">
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <>
      {done ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">¡Contraseña actualizada!</h2>
          <p className="text-sm text-gray-500">Serás redirigido al inicio de sesión en un momento...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-gray-500">Elige una contraseña segura.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${!showPassword ? "tracking-widest" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordRules.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
                        {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm.length > 0 && (
                <p className={`mt-1 text-xs flex items-center gap-1 ${confirmMatch ? "text-green-600" : "text-red-500"}`}>
                  {confirmMatch
                    ? <><Check className="w-3.5 h-3.5" /> Las contraseñas coinciden</>
                    : <><X className="w-3.5 h-3.5" /> Las contraseñas no coinciden</>
                  }
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !passwordValid || !confirmMatch}
              className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-indigo-600 font-bold text-xl tracking-tight">FinlyCR</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Suspense fallback={null}>
            <ResetPasswordInner />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
