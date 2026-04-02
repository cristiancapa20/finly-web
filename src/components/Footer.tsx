/**
 * @module Footer
 * Pie de página con información de la aplicación, enlaces de navegación y redes sociales.
 */

"use client";

import { Github, Linkedin, Instagram, Globe, TrendingUp } from "lucide-react";
import { Link } from "next-view-transitions";

const socialLinks = [
  { href: "https://github.com/cristiancapa20", icon: Github, label: "GitHub" },
  { href: "https://www.linkedin.com/in/cristian-capa/", icon: Linkedin, label: "LinkedIn" },
  { href: "https://www.instagram.com/capita_cr", icon: Instagram, label: "Instagram" },
  { href: "https://portafolio-web-cr.vercel.app/", icon: Globe, label: "Portafolio" },
];

const services = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/transactions", label: "Nueva transacción" },
  { href: "/history", label: "Transacciones" },
  { href: "/commitments", label: "Compromisos" },
  { href: "/accounts", label: "Cuentas" },
  { href: "/help", label: "Ayuda" },
];

/**
 * Componente de pie de página que muestra información de la aplicación,
 * enlaces de servicios y redes sociales del desarrollador.
 * @returns {React.ReactElement} El pie de página renderizado
 */
export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white/70 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 text-sm md:grid-cols-2 xl:grid-cols-3">
        {/* Columna 1: Nombre de la app */}
        <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-semibold text-gray-900 text-base">FinlyCR</h3>
          </div>
          <p className="max-w-md text-gray-500">
            Controla tus finanzas personales: gastos, ingresos, cuentas y préstamos.
          </p>
        </div>

        {/* Columna 2: Servicios */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-gray-900 text-base">Servicios</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-2">
            {services.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block truncate text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Creador y redes */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-gray-900 text-base">Creador</h3>
          <p className="text-gray-600 font-medium">Cristian Capa</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} FinlyCR. Todos los derechos reservados.
      </div>
    </footer>
  );
}
