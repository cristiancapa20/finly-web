import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía de uso",
  description:
    "Aprende a usar FinlyCR paso a paso: crea cuentas, registra transacciones, gestiona préstamos y controla tus suscripciones.",
  alternates: {
    canonical: "https://finlycr.com/help",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
