# FinlyCR

Aplicacion web de finanzas personales diseñada para ayudarte a controlar tus ingresos, gastos, cuentas, prestamos y suscripciones de manera sencilla e intuitiva.

## Descripcion

FinlyCR es una PWA (Progressive Web App) que te permite gestionar tus finanzas personales desde cualquier dispositivo. Con una interfaz en español y optimizada para movil, puedes registrar transacciones, monitorear tus cuentas, hacer seguimiento a prestamos y automatizar suscripciones recurrentes.

### Caracteristicas principales

- **Dashboard** — Vista general de tu situacion financiera con graficos de ingresos vs gastos, resumen de cuentas y estadisticas diarias/mensuales.
- **Transacciones** — Registro de ingresos y gastos con categorizacion, filtros por cuenta/categoria/fecha y exportacion de datos.
- **Parsing con IA** — Describe una transaccion en lenguaje natural y Claude AI la interpreta automaticamente (monto, categoria, tipo).
- **Cuentas multiples** — Administra varias cuentas (efectivo, banco, tarjetas) con balances independientes.
- **Prestamos y deudas** — Seguimiento de dinero prestado o adeudado, con registro de pagos y fechas de vencimiento.
- **Suscripciones** — Gestion de pagos recurrentes mensuales con procesamiento automatico via cron.
- **PWA** — Instalable en tu dispositivo, con soporte offline y navegacion tipo app nativa.
- **Autenticacion** — Login seguro con email/contraseña, recuperacion de contraseña por email.
- **Onboarding** — Guia interactiva para nuevos usuarios.

## Tech Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | SQLite (dev) / Turso (prod) |
| ORM | Prisma |
| Autenticacion | NextAuth.js (JWT) |
| Charts | Recharts |
| IA | Anthropic Claude (parsing de transacciones) |
| Email | Resend |
| Data fetching | React Query |
| Deploy | Vercel |

## Requisitos previos

- Node.js 18+ (o Bun)
- npm, yarn o bun
- Una API key de [Anthropic](https://console.anthropic.com/) (para el parsing con IA)
- Una API key de [Resend](https://resend.com/) (para recuperacion de contraseña)
- *(Opcional)* Una base de datos [Turso](https://turso.tech/) para produccion

## Instalacion

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd finance

# 2. Instalar dependencias
npm install
# o con bun:
bun install

# 3. Configurar variables de entorno
cp .env.example .env
```

## Configuracion

Edita el archivo `.env` con tus valores:

```env
# Auth
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Base de datos (SQLite por defecto)
DATABASE_URL=file:./dev.db

# Turso (solo para produccion)
TURSO_DATABASE_URL=libsql://tu-db.turso.io
TURSO_AUTH_TOKEN=tu-token
USE_TURSO_IN_DEV=false

# Anthropic (parsing IA)
ANTHROPIC_API_KEY=sk-ant-...

# Resend (emails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=no-reply@tudominio.com
```

### Inicializar la base de datos

```bash
# Generar el cliente Prisma y aplicar migraciones
npx prisma generate
npx prisma db push

# (Opcional) Sembrar datos iniciales
npm run seed
```

## Uso

### Desarrollo

```bash
npm run dev
```

La app estara disponible en `http://localhost:3000`.

### Produccion

```bash
# Construir
npm run build

# Iniciar servidor
npm start
```

### Otros comandos

| Comando | Descripcion |
|---------|------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de produccion (prisma generate + next build) |
| `npm start` | Iniciar servidor de produccion |
| `npm run lint` | Ejecutar ESLint |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run seed` | Sembrar base de datos con datos iniciales |
| `npm run db:turso:migrate` | Migrar schema a Turso (produccion) |

## Estructura del proyecto

```
src/
├── app/
│   ├── api/              # Endpoints de la API REST
│   │   ├── accounts/     # CRUD de cuentas
│   │   ├── categories/   # CRUD de categorias
│   │   ├── transactions/ # CRUD de transacciones + exportacion
│   │   ├── loans/        # CRUD de prestamos y pagos
│   │   ├── subscriptions/# CRUD de suscripciones
│   │   ├── stats/        # Estadisticas (diarias, mensuales)
│   │   ├── parse-transaction/ # Parsing IA con Claude
│   │   └── auth/         # Autenticacion y reset de contraseña
│   ├── dashboard/        # Pagina principal
│   ├── transactions/     # Formulario de nueva transaccion
│   ├── history/          # Historial de transacciones
│   ├── loans/            # Gestion de prestamos
│   ├── commitments/      # Suscripciones recurrentes
│   ├── cuentas/          # Administracion de cuentas
│   └── ...               # Login, registro, perfil, ayuda
├── components/           # Componentes React reutilizables
├── lib/                  # Utilidades (auth, prisma, currency, etc.)
├── hooks/                # Custom hooks
├── context/              # React contexts (moneda del usuario)
└── types/                # Definiciones de tipos TypeScript
prisma/
├── schema.prisma         # Schema de la base de datos
└── seed.ts               # Script de datos iniciales
```

## Deploy en Vercel

1. Conecta tu repositorio a [Vercel](https://vercel.com/).
2. Configura las variables de entorno en el panel de Vercel.
3. Si usas Turso, configura `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.
4. El cron job para procesar suscripciones se ejecuta automaticamente a las 00:00 UTC diariamente (configurado en `vercel.json`).

## Licencia

Proyecto privado.
