"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Check, X, HelpCircle, TrendingUp, BarChart2, Wallet, HandCoins, Bell } from "lucide-react";
import { toast } from "@/lib/toast";
import Link from "next/link";
import UsageGuideModal from "@/components/UsageGuideModal";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const passwordRules: Rule[] = [
  { label: "Mínimo 6 caracteres", test: (v) => v.length >= 6 },
  { label: "Al menos una letra", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "Al menos un número", test: (v) => /\d/.test(v) },
];

const features = [
  {
    Icon: BarChart2,
    title: "Dashboard en tiempo real",
    desc: "Visualiza ingresos y gastos con gráficos claros",
  },
  {
    Icon: Wallet,
    title: "Múltiples cuentas",
    desc: "Maneja efectivo, banco y tarjetas en un solo lugar",
  },
  {
    Icon: HandCoins,
    title: "Control de préstamos",
    desc: "Registra lo que debes y lo que te deben con facilidad",
  },
  {
    Icon: Bell,
    title: "Alertas de vencimiento",
    desc: "Recibe avisos antes de que venzan tus deudas",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
    <>
    <div className="h-screen flex">
      {/* ── Left panel: branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 flex-col p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-16 -left-20 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-6 w-36 h-36 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10 animate-fade-in-left" style={{ animationDelay: "0s" }}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Finance Tracker</span>
        </div>

        {/* Main copy + features — centered vertically in remaining space */}
        <div className="flex-1 flex flex-col justify-center space-y-8 relative z-10">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight animate-fade-in-left" style={{ animationDelay: "0.12s" }}>
              Empieza a organizar tu dinero hoy
            </h2>
            <p className="mt-4 text-indigo-200 text-base leading-relaxed animate-fade-in-left" style={{ animationDelay: "0.22s" }}>
              Crea tu cuenta gratis y comienza a registrar tus gastos, ingresos y préstamos en minutos.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex items-start gap-3 animate-fade-in-up"
                style={{ animationDelay: `${0.32 + i * 0.1}s` }}
              >
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-indigo-300 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-8 text-center animate-fade-in" style={{ animationDelay: "0s" }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-indigo-600 font-bold text-xl tracking-tight">Finance Tracker</span>
            </div>
            <p className="text-gray-500 text-sm">Toma el control de tus finanzas</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 transition text-xs font-medium"
            >
              <HelpCircle className="w-4 h-4" />
              ¿Cómo usar la app?
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Crea tu cuenta</h1>
              <p className="mt-1 text-gray-500 text-sm">Es gratis y solo toma un momento</p>
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
                disabled={loading || !email.trim() || !fullName.trim() || !passwordValid || !confirmMatch}
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
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>

    {showGuide && <UsageGuideModal onClose={() => setShowGuide(false)} />}
    </>
  );
}
