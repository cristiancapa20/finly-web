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
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Nueva transacción" },
  { href: "/historial", label: "Transacciones" },
  { href: "/loans", label: "Préstamos" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/help", label: "Ayuda" },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 py-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-around text-sm">
        {/* Columna 1: Nombre de la app */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-semibold text-gray-900 text-base">Finance Tracker</h3>
          </div>
          <p className="text-gray-500">
            Controla tus finanzas personales: gastos, ingresos, cuentas y préstamos.
          </p>
        </div>

        {/* Columna 2: Servicios */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-gray-900 text-base">Servicios</h3>
          <ul className="flex flex-inline gap-x-4 gap-y-1.5">
            {services.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
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
          <div className="flex items-center gap-3 mt-1">
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
      <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-gray-100 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} Finance Tracker. Todos los derechos reservados.
      </div>
    </footer>
  );
}
