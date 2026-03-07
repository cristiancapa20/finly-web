"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  User, LogOut, ChevronDown, LayoutDashboard,
  PlusCircle, History, Wallet, X, Menu, TrendingUp, HelpCircle, HandCoins,
} from "lucide-react";
import Image from "next/image";

function UserAvatar({ name, size = 8 }: { name?: string | null; size?: number }) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.data?.avatar) setAvatar(d.data.avatar); });
  }, []);

  const initial = (name ?? "?")[0].toUpperCase();
  const sizeClass = `w-${size} h-${size}`;

  return (
    <div className={`relative ${sizeClass} rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0`}>
      {avatar
        ? <Image src={avatar} alt="Avatar" fill className="object-cover rounded-full" unoptimized />
        : <span className="text-xs font-bold text-indigo-600">{initial}</span>
      }
    </div>
  );
}

const navLinks = [
  { href: "/dashboard",    label: "Dashboard",          icon: LayoutDashboard },
  { href: "/transactions", label: "Nueva transacción",  icon: PlusCircle },
  { href: "/historial",    label: "Historial",           icon: History },
  { href: "/loans",        label: "Préstamos",           icon: HandCoins },
  { href: "/settings",     label: "Cuentas",              icon: Wallet },
  { href: "/help",         label: "Ayuda",               icon: HelpCircle },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header className="bg-gray-900 border-b border-white/10 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Finance Tracker
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    pathname === href ? "text-indigo-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop profile */}
            <div className="hidden md:flex items-center gap-4">
              {session?.user && (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <UserAvatar name={session.user.name} />
                    <span className="text-sm font-medium text-white">{session.user.name}</span>
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

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white transition-colors"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 md:hidden flex flex-col
          bg-gray-900 text-white shadow-2xl
          transition-transform duration-300 ease-in-out
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-lg font-bold text-white"
          >
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Finance Tracker
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — user info */}
        {session?.user && (
          <div className="border-t border-white/10 px-3 py-4 space-y-1">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <UserAvatar name={session.user.name} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{session.user.name}</p>
                <p className="text-gray-400 text-xs">Editar perfil</p>
              </div>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              Salir
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
