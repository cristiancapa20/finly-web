"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  User, LogOut, LayoutDashboard,
  PlusCircle, ArrowLeftRight, Wallet, X, Menu, TrendingUp, HelpCircle, HandCoins,
} from "lucide-react";
import Image from "next/image";
import { useIsPWA } from "@/hooks/useIsPWA";

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
  { href: "/dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { href: "/transactions", label: "Nueva transacción", icon: PlusCircle },
  { href: "/historial",    label: "Transacciones",      icon: ArrowLeftRight },
  { href: "/loans",        label: "Préstamos",          icon: HandCoins },
  { href: "/cuentas",      label: "Cuentas",             icon: Wallet },
  { href: "/help",         label: "Guía de uso",        icon: HelpCircle },
];

function SidebarContent({ pathname, onClose, session }: {
  pathname: string;
  onClose?: () => void;
  session: { user?: { name?: string | null } } | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 text-lg font-bold text-white"
        >
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Finance Tracker
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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

      {/* User profile at bottom */}
      {session?.user && (
        <div className="border-t border-white/10 px-3 py-4 space-y-1">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <UserAvatar name={session.user.name} size={8} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{session.user.name}</p>
              <p className="text-gray-400 text-xs">Editar perfil</p>
            </div>
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Salir
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isPWA = useIsPWA();

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Desktop sidebar (fixed left) — siempre visible en md+ ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-gray-900 flex-col z-30 shadow-xl">
        <SidebarContent pathname={pathname} session={session} />
      </aside>

      {/* ── Mobile top bar — se oculta en modo PWA ── */}
      {!isPWA && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-white/10 h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold text-white">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Finance Tracker
          </Link>
        </header>
      )}

      {/* ── Mobile overlay — solo en modo web ── */}
      {!isPWA && (
        <div
          className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
            menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── Mobile sidebar panel — solo en modo web ── */}
      {!isPWA && (
        <aside
          ref={sidebarRef}
          className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden bg-gray-900 shadow-2xl
            transition-transform duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContent
            pathname={pathname}
            onClose={() => setMenuOpen(false)}
            session={session}
          />
        </aside>
      )}
    </>
  );
}
