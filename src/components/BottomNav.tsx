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
  { href: "/dashboard",    label: "Inicio",     icon: LayoutDashboard },
  { href: "/historial",    label: "Historial",  icon: History },
  { href: "/loans",        label: "Préstamos",  icon: HandCoins },
  { href: "/cuentas",      label: "Cuentas",    icon: Wallet },
  { href: "/profile",      label: "Perfil",     icon: User },
];

export default function BottomNav() {
  const isPWA = useIsPWA();
  const pathname = usePathname();

  if (!isPWA) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 bottom-nav-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors active:scale-95 ${
                active ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "text-indigo-400" : "text-gray-500"}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
