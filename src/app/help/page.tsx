import Link from "next/link";
import {
  UserPlus,
  Wallet,
  MessageSquareText,
  Plus,
  History,
  LayoutDashboard,
  Settings,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface Step {
  text: string;
  tip?: string;
}

interface Section {
  id: string;
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  steps: Step[];
  link?: { href: string; label: string };
}

const sections: Section[] = [
  {
    id: "registro",
    icon: UserPlus,
    color: "indigo",
    title: "1. Crear tu cuenta",
    description: "El primer paso es registrarte en la app.",
    steps: [
      { text: 'Ve a la página de registro haciendo clic en "Regístrate".' },
      { text: "Ingresa tu nombre completo, correo electrónico y una contraseña segura (mínimo 6 caracteres, con letras y números)." },
      { text: 'Haz clic en "Crear cuenta". Serás redirigido al login.' },
      { text: "Inicia sesión con tu correo y contraseña.", tip: "Tu correo y contraseña son los únicos datos que necesitas para acceder." },
    ],
    link: { href: "/register", label: "Ir a registro" },
  },
  {
    id: "cuentas",
    icon: Wallet,
    color: "blue",
    title: "2. Configurar tus cuentas bancarias",
    description: "Antes de registrar transacciones necesitas crear al menos una cuenta (banco, tarjeta, efectivo, etc.).",
    steps: [
      { text: 'Ve a "Configuración" desde el menú de navegación.' },
      { text: 'En la sección "Cuentas" haz clic en "Nueva cuenta".' },
      { text: "Escribe el nombre de la cuenta (ej: Banco Pichincha, Tarjeta de crédito, Efectivo) y selecciona un tipo y color." },
      { text: 'Haz clic en "Guardar". Puedes crear todas las cuentas que necesites.', tip: "El nombre que le des a la cuenta es importante — el AI la reconocerá cuando la menciones al registrar transacciones." },
    ],
    link: { href: "/settings", label: "Ir a Configuración" },
  },
  {
    id: "transacciones",
    icon: MessageSquareText,
    color: "violet",
    title: "3. Registrar transacciones",
    description: "La forma principal de registrar transacciones es describiendo lo que pasó en lenguaje natural.",
    steps: [
      { text: 'Ve a "Nueva transacción" desde el menú.' },
      { text: 'En el campo de texto describe la transacción, por ejemplo: "Pagué 45.50 en el supermercado hoy con mi tarjeta de crédito".', tip: "Puedes mencionar el monto, el tipo (ingreso/gasto), la categoría, la cuenta y la fecha — el AI lo detecta automáticamente." },
      { text: 'Haz clic en "Procesar". El AI analizará tu texto y completará los campos automáticamente.' },
      { text: "Revisa los campos detectados. Los marcados con ★ en color ámbar no fueron detectados y debes completarlos manualmente." },
      { text: 'Haz clic en "Guardar" para confirmar la transacción.' },
    ],
    link: { href: "/transactions", label: "Nueva transacción" },
  },
  {
    id: "boton-flotante",
    icon: Plus,
    color: "emerald",
    title: "4. Botón flotante de acceso rápido",
    description: "El botón + en la esquina inferior derecha te permite registrar transacciones desde cualquier página.",
    steps: [
      { text: "Haz clic en el botón circular índigo en la esquina inferior derecha de cualquier página." },
      { text: "Se abrirá un panel donde puedes escribir o hablar tu transacción sin salir de la página actual." },
      { text: "Al guardar, el panel se cierra automáticamente y puedes seguir donde estabas.", tip: "En móvil el panel sube desde abajo, en escritorio aparece como ventana centrada." },
    ],
  },
  {
    id: "historial",
    icon: History,
    color: "amber",
    title: "5. Ver el historial",
    description: "El historial muestra todas tus transacciones con opciones de filtrado y exportación.",
    steps: [
      { text: 'Ve a "Historial" desde el menú de navegación.' },
      { text: "Usa los filtros de Tipo, Categoría y fechas para encontrar transacciones específicas." },
      { text: "Haz clic en el ícono de lápiz ✏️ para editar una transacción existente." },
      { text: 'Haz clic en el ícono de basurero 🗑️ para eliminar una transacción (te pedirá confirmación).', tip: "Puedes exportar todas las transacciones filtradas a CSV haciendo clic en \"Exportar CSV\"." },
    ],
    link: { href: "/historial", label: "Ir al Historial" },
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    color: "cyan",
    title: "6. Dashboard",
    description: "El dashboard muestra un resumen visual de tus finanzas.",
    steps: [
      { text: "Desde el Dashboard puedes ver el balance total, ingresos y gastos del mes." },
      { text: "El gráfico mensual muestra la evolución de ingresos y gastos en los últimos meses." },
      { text: "Los gastos por categoría te muestran en qué estás gastando más.", tip: "El dashboard se actualiza automáticamente cada vez que registras una nueva transacción." },
    ],
    link: { href: "/dashboard", label: "Ir al Dashboard" },
  },
  {
    id: "perfil",
    icon: Settings,
    color: "slate",
    title: "7. Perfil y configuración",
    description: "Personaliza tu cuenta y gestiona tus categorías.",
    steps: [
      { text: "Desde tu avatar en el menú accede a tu perfil para cambiar tu nombre y foto." },
      { text: 'En "Configuración" puedes gestionar tus cuentas bancarias y crear categorías personalizadas.' },
      { text: "Las categorías del sistema (Alimentación, Transporte, etc.) están disponibles para todos los usuarios.", tip: "Puedes crear tus propias categorías con colores e íconos personalizados que solo tú verás." },
    ],
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string; border: string }> = {
  indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600",  badge: "bg-indigo-100 text-indigo-700",  border: "border-indigo-200" },
  blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700",      border: "border-blue-200" },
  violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  badge: "bg-violet-100 text-violet-700",  border: "border-violet-200" },
  rose:    { bg: "bg-rose-50",    icon: "text-rose-600",    badge: "bg-rose-100 text-rose-700",      border: "border-rose-200" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700",border: "border-emerald-200" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700",    border: "border-amber-200" },
  cyan:    { bg: "bg-cyan-50",    icon: "text-cyan-600",    badge: "bg-cyan-100 text-cyan-700",      border: "border-cyan-200" },
  slate:   { bg: "bg-slate-50",   icon: "text-slate-600",   badge: "bg-slate-100 text-slate-700",    border: "border-slate-200" },
};

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-4">
          <MessageSquareText className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Guía de uso</h1>
        <p className="mt-2 text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
          Todo lo que necesitas saber para usar Finance Tracker y llevar el control de tus finanzas personales.
        </p>

        {/* Quick nav */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              {s.title.replace(/^\d+\.\s/, "")}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const c = colorMap[section.color];
        const Icon = section.icon;
        return (
          <div
            key={section.id}
            id={section.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-20"
          >
            {/* Section header */}
            <div className={`flex items-center gap-3 px-6 py-4 ${c.bg} border-b ${c.border}`}>
              <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-3">
              {section.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${c.badge}`}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{step.text}</p>
                    {step.tip && (
                      <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                        <span>{step.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Link */}
            {section.link && (
              <div className={`px-6 py-3 border-t ${c.border} ${c.bg}`}>
                <Link
                  href={section.link.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${c.icon} hover:underline`}
                >
                  {section.link.label}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        );
      })}

      {/* Footer tip */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-6 py-5 text-center">
        <p className="text-sm text-indigo-700 font-medium">¿Tienes alguna duda?</p>
        <p className="text-xs text-indigo-600 mt-1">
          Puedes navegar entre secciones usando los accesos rápidos en la parte superior de esta página.
        </p>
      </div>

    </div>
  );
}
