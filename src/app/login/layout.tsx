import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede a tu cuenta en FinlyCR para controlar tus finanzas personales, gastos, ingresos y préstamos.",
  alternates: {
    canonical: "https://finlycr.com/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
