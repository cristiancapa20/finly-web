"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  HandCoins,
  Wallet,
  User,
} from "lucide-react";
import { useIsPWA } from "@/hooks/useIsPWA";

const tabs = [
  { href: "/dashboard", label: "Inicio",    icon: LayoutDashboard },
  { href: "/historial", label: "Transacciones", icon: History },
  { href: "/loans",     label: "Préstamos", icon: HandCoins },
  { href: "/cuentas",   label: "Cuentas",   icon: Wallet },
  { href: "/profile",   label: "Perfil",    icon: User },
];

export default function BottomNav() {
  const isPWA = useIsPWA();
  const pathname = usePathname();

  if (!isPWA) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 bottom-nav-safe">
      {/* sin justify-around: flex-1 en cada tab reparte el ancho exactamente en 5 partes iguales */}
      <div className="flex h-16 w-full">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-0 gap-[3px] transition-all duration-150 active:opacity-60 ${
                active ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              {/* Indicador activo: línea en la parte superior */}
              {active && (
                <span className="absolute top-0 inset-x-0 h-[2px] rounded-full bg-indigo-400" />
              )}

              <Icon
                className="w-[22px] h-[22px] shrink-0"
                strokeWidth={active ? 2.5 : 1.8}
              />

              {/* w-full + text-center + truncate evita que el texto se desborde entre tabs */}
              <span className="w-full text-center text-[10px] font-medium leading-none truncate px-1">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
