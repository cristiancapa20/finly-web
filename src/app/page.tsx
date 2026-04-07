import Link from "next/link";
import {
  TrendingUp,
  BarChart2,
  Wallet,
  HandCoins,
  Bell,
  RefreshCw,
  Shield,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: BarChart2,
    title: "Dashboard en tiempo real",
    description:
      "Visualiza tus ingresos y gastos con gráficos claros e intuitivos. Entiende tus finanzas de un vistazo.",
  },
  {
    icon: Wallet,
    title: "Múltiples cuentas",
    description:
      "Maneja efectivo, banco y tarjetas de crédito en un solo lugar. Controla el saldo de cada cuenta.",
  },
  {
    icon: HandCoins,
    title: "Control de préstamos",
    description:
      "Registra lo que debes y lo que te deben. Lleva un seguimiento claro de cada compromiso financiero.",
  },
  {
    icon: Bell,
    title: "Alertas de vencimiento",
    description:
      "Recibe avisos antes de que venzan tus deudas y suscripciones. Nunca más pagues tarde.",
  },
  {
    icon: RefreshCw,
    title: "Suscripciones recurrentes",
    description:
      "Controla Netflix, Spotify y todos tus pagos mensuales. Pausa o reactiva cuando quieras.",
  },
  {
    icon: Shield,
    title: "Seguro y privado",
    description:
      "Tus datos financieros están protegidos. Solo tú tienes acceso a tu información.",
  },
];

const steps = [
  {
    number: "1",
    title: "Crea tu cuenta",
    description: "Regístrate gratis con tu correo electrónico en menos de un minuto.",
  },
  {
    number: "2",
    title: "Configura tus cuentas",
    description: "Agrega tus cuentas bancarias, tarjetas o efectivo con su saldo inicial.",
  },
  {
    number: "3",
    title: "Registra y controla",
    description: "Empieza a registrar transacciones y toma el control de tus finanzas.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">
              FinlyCR
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 transition-colors"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-6">
            <Smartphone className="w-3.5 h-3.5" />
            Disponible como app móvil (PWA)
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Toma el control de tus{" "}
            <span className="text-indigo-600">finanzas personales</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Registra gastos e ingresos, gestiona cuentas bancarias y lleva
            seguimiento de préstamos y suscripciones. Todo en un solo lugar,
            gratis.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-base"
            >
              Empezar gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/help"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-base"
            >
              Ver guía de uso
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Todo lo que necesitas para tus finanzas
            </h2>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
              Herramientas simples y poderosas para que nunca pierdas de vista a
              dónde va tu dinero.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Empieza en 3 pasos
            </h2>
            <p className="mt-4 text-gray-600 text-lg">
              Sin complicaciones. Sin costos ocultos.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Empieza a controlar tus finanzas hoy
          </h2>
          <p className="mt-4 text-indigo-200 text-lg">
            Es gratis, rápido y no necesitas tarjeta de crédito.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-base"
          >
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">FinlyCR</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              Guía de uso
            </Link>
            <Link href="/login" className="hover:text-gray-700 transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="hover:text-gray-700 transition-colors">
              Registrarse
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} FinlyCR. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
