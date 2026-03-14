"use client";

import { Github, Linkedin, Instagram, Globe } from "lucide-react";
import Link from "next/link";
import { useIsPWA } from "@/hooks/useIsPWA";

const socialLinks = [
  { href: "https://github.com/cristiancapa20",           icon: Github,    label: "GitHub" },
  { href: "https://www.linkedin.com/in/cristian-capa/", icon: Linkedin,  label: "LinkedIn" },
  { href: "https://www.instagram.com/capita_cr",        icon: Instagram, label: "Instagram" },
  { href: "https://portafolio-web-cr.vercel.app/",      icon: Globe,     label: "Portafolio" },
];

const appSections = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/transactions", label: "Transferencias" },
  { href: "/loans",        label: "Préstamos" },
  { href: "/cuentas",      label: "Cuentas" },
  { href: "/historial",    label: "Historial" },
];

export default function Footer() {
  const isPWA = useIsPWA();

  if (isPWA) return null;

  return (
    <footer className="mt-12 border-t border-gray-200 py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-gray-500">
        {/* Column 1: App name */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-gray-800">Finance Tracker</h3>
          <p className="text-gray-400 leading-relaxed">
            Controla tus finanzas personales: gastos, ingresos, cuentas y préstamos.
          </p>
        </div>

        {/* Column 2: App sections */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-gray-800">Servicios</h3>
          <ul className="flex flex-col gap-1">
            {appSections.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Social links + author */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-gray-800">Redes sociales</h3>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-gray-900 hover:text-indigo-600 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <p className="mt-2 text-gray-400">
            © {new Date().getFullYear()} — Hecho por{" "}
            <span className="font-medium text-gray-600">Cristian Capa</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
