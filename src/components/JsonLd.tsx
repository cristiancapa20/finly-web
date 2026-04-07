interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FinlyCR",
  url: "https://finlycr.com",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Aplicación web para controlar finanzas personales: gastos, ingresos, cuentas bancarias, préstamos y suscripciones.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  inLanguage: "es",
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cómo creo mi cuenta en FinlyCR?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ve a la página de registro, ingresa tu nombre completo, correo electrónico y una contraseña segura (mínimo 8 caracteres). Haz clic en 'Crear cuenta' y luego inicia sesión.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo configuro mis cuentas bancarias?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ve a Configuración desde el menú, en la sección Cuentas haz clic en 'Nueva cuenta'. Escribe el nombre, selecciona tipo y color, e ingresa el saldo inicial.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo registro una transacción?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ve a 'Nueva transacción' desde el menú, completa monto, tipo (Ingreso o Gasto), categoría, cuenta y fecha. También puedes usar el botón flotante '+' desde cualquier página.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué monedas soporta FinlyCR?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FinlyCR soporta USD, EUR, MXN, COP, CRC (Colón costarricense), ARS, CLP, PEN, BRL y GBP. Puedes cambiar tu moneda desde tu Perfil.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo controlar mis suscripciones recurrentes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Ve a 'Compromisos' y selecciona la pestaña 'Suscripciones'. Puedes agregar, pausar y editar suscripciones con monto, día de cobro y cuenta asociada.",
      },
    },
  ],
};
