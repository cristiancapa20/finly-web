"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { User, LogOut, ChevronDown } from "lucide-react";

function UserAvatar({ name }: { name?: string | null }) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { if (d.data?.avatar) setAvatar(d.data.avatar); });
  }, []);

  const initial = (name ?? "?")[0].toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
      {avatar
        ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
        : <span className="text-xs font-bold text-indigo-600">{initial}</span>
      }
    </div>
  );
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Nueva transacción" },
  { href: "/historial", label: "Historial" },
  { href: "/settings", label: "Configuración" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
            {session?.user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <UserAvatar name={session.user.name} />
                  <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Editar perfil
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </div>
                )}
              </div>
            )}
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
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-600 hover:text-indigo-600"
            >
              Editar perfil
            </Link>
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
