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
  DollarSign,
  RefreshCw,
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
      { text: "Ingresa tu nombre completo, correo electrónico y una contraseña segura (mínimo 8 caracteres, con letras y números)." },
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
      { text: "Ingresa el saldo inicial de la cuenta. Este es el monto con el que arranca tu cuenta en la app.", tip: "El saldo inicial es obligatorio. A partir de él se calculará tu balance sumando todas las transacciones futuras." },
      { text: 'Haz clic en "Guardar". Puedes crear todas las cuentas que necesites.', tip: "El nombre que le des a la cuenta es importante — el AI la reconocerá cuando la menciones al registrar transacciones." },
    ],
    link: { href: "/settings", label: "Ir a Configuración" },
  },
  {
    id: "transacciones",
    icon: MessageSquareText,
    color: "violet",
    title: "3. Registrar transacciones",
    description: "Registra tus ingresos y gastos completando un formulario rápido.",
    steps: [
      { text: 'Ve a "Nueva transacción" desde el menú.' },
      { text: "Completa los campos del formulario: monto, tipo (Ingreso o Gasto), categoría, cuenta y fecha.", tip: "La fecha se llena automáticamente con el día de hoy, pero puedes cambiarla." },
      { text: "Opcionalmente agrega una descripción para recordar de qué se trató la transacción." },
      { text: "El selector de cuenta te muestra el saldo disponible. Si el gasto supera el saldo, verás una advertencia de saldo insuficiente." },
      { text: 'Haz clic en "Guardar transacción" para confirmar. Usa "Limpiar" si quieres reiniciar el formulario.', tip: "Necesitas tener al menos una cuenta creada en Configuración para poder registrar transacciones." },
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
      { text: "Haz clic en el botón circular índigo con el ícono + en la esquina inferior derecha de cualquier página." },
      { text: "Se abrirá el mismo formulario de transacción (monto, tipo, categoría, cuenta, descripción y fecha) sin salir de la página actual.", tip: "En móvil el panel sube desde abajo, en escritorio aparece como ventana centrada." },
      { text: "Al guardar la transacción, el panel se cierra automáticamente y puedes seguir donde estabas." },
      { text: "También puedes cerrar el panel con la tecla Escape, el botón de cerrar o haciendo clic fuera del panel." },
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
    link: { href: "/history", label: "Ir al Historial" },
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
    id: "moneda",
    icon: DollarSign,
    color: "emerald",
    title: "7. Tipo de moneda",
    description: "Selecciona la moneda en la que deseas ver todos tus montos (USD, EUR, CRC, etc.).",
    steps: [
      { text: "Al crear tu cuenta por primera vez, el asistente de bienvenida te pedirá seleccionar tu moneda preferida." },
      { text: "Las monedas disponibles son: USD (Dólar), EUR (Euro), MXN (Peso mexicano), COP (Peso colombiano), CRC (Colón), ARS (Peso argentino), CLP (Peso chileno), PEN (Sol peruano), BRL (Real brasileño) y GBP (Libra esterlina).", tip: "La moneda por defecto es USD. Todos los montos en la app se formatearán según la moneda que elijas." },
      { text: 'Si deseas cambiarla después, ve a tu "Perfil" y selecciona una nueva moneda en el campo correspondiente.' },
    ],
    link: { href: "/profile", label: "Ir a Perfil" },
  },
  {
    id: "suscripciones",
    icon: RefreshCw,
    color: "rose",
    title: "8. Suscripciones",
    description: "Lleva el control de tus pagos recurrentes mensuales (Netflix, Spotify, etc.).",
    steps: [
      { text: 'Ve a "Compromisos" desde el menú y selecciona la pestaña "Suscripciones".' },
      { text: 'Haz clic en "Nueva suscripción" e ingresa el nombre del servicio, monto mensual, día de cobro (1-31) y la cuenta de cobro.', tip: "También puedes asignar una categoría para organizar mejor tus gastos recurrentes." },
      { text: "En la parte superior verás un resumen con el total mensual de suscripciones activas y la cantidad de activas/pausadas." },
      { text: 'Puedes pausar una suscripción sin eliminarla haciendo clic en "Pausar". Cuando se reactive, volverá a contar en tu total mensual.', tip: "Unos días antes del cobro verás un aviso en la tarjeta indicando cuándo se descuenta." },
      { text: "Para editar o eliminar una suscripción, usa los botones de acción en cada tarjeta." },
    ],
    link: { href: "/loans", label: "Ir a Compromisos" },
  },
  {
    id: "perfil",
    icon: Settings,
    color: "slate",
    title: "9. Perfil y configuración",
    description: "Personaliza tu cuenta y gestiona tus categorías.",
    steps: [
      { text: "Desde tu avatar en el menú accede a tu perfil para cambiar tu nombre, foto y moneda preferida." },
      { text: 'En "Configuración" puedes gestionar tus cuentas bancarias (nombre, tipo, color y saldo inicial) y crear categorías personalizadas.' },
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
          Todo lo que necesitas saber para usar FinlyCR y llevar el control de tus finanzas personales.
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
