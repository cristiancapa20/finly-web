"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const passwordRules: Rule[] = [
  { label: "Mínimo 6 caracteres", test: (v) => v.length >= 6 },
  { label: "Al menos una letra", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "Al menos un número", test: (v) => /\d/.test(v) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));
  const confirmMatch = confirm.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("La contraseña no cumple los requisitos");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), fullName: fullName.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al registrarse");
        return;
      }

      toast.success({ title: "Cuenta creada, ya puedes iniciar sesión" });
      router.push("/login?registered=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">Finance Tracker</h1>
          <p className="mt-2 text-gray-500 text-sm">Crea tu cuenta para empezar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Tu nombre completo"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="tu@correo.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-5 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${!showPassword ? "tracking-widest" : ""}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password rules */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
                      {ok
                        ? <Check className="w-3.5 h-3.5" />
                        : <X className="w-3.5 h-3.5" />
                      }
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full pl-5 pr-12 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${!showConfirm ? "tracking-widest" : ""} ${
                  confirm.length === 0
                    ? "border-gray-300 focus:ring-indigo-500"
                    : confirmMatch
                    ? "border-green-400 focus:ring-green-400"
                    : "border-red-400 focus:ring-red-400"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
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
            className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-indigo-600 font-medium hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
