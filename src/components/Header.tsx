"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Nueva transacción" },
  { href: "/historial", label: "Historial" },
  { href: "/settings", label: "Configuración" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
            Finance Tracker
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {session?.user?.name && (
              <span className="text-sm text-gray-500">{session.user.name}</span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Salir
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-indigo-600"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100">
            {session?.user?.name && (
              <p className="text-sm text-gray-500 py-1">{session.user.name}</p>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block py-2 text-sm font-medium text-red-600"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
