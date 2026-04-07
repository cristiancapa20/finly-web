import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Regístrate gratis en FinlyCR y empieza a controlar tus finanzas personales: gastos, ingresos, cuentas y préstamos.",
  alternates: {
    canonical: "https://finlycr.com/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
