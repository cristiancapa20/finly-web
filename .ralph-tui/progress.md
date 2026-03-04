# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Auth**: NextAuth v4 with Credentials Provider. `authOptions` exported from `src/lib/auth.ts` and reused in API route + `getServerSession` calls.
- **Route protection**: `middleware.ts` at root uses `next-auth/middleware` default export. Matcher excludes `api/auth`, `login`, `_next/*`, `favicon.ico`.
- **Client components**: Anything using hooks (`useState`, `useSession`, `useRouter`, `useSearchParams`) or browser APIs needs `"use client"` directive.
- **SessionProvider**: Wrapped in `src/components/Providers.tsx` client component, used in root layout.
- **Layout**: Root layout conditionally renders `<Header>` only when session exists (server-side check via `getServerSession`).
- **Path alias**: `@/*` maps to `src/*` — use `@/lib/auth`, `@/components/Header`, etc.

---

## 2026-03-04 - US-001
- **What was implemented**: Full Next.js 14 project scaffold with App Router, TypeScript, Tailwind CSS, NextAuth.js Credentials Provider, login page, route protection middleware, responsive header with mobile menu, and logout functionality.
- **Files changed**:
  - `package.json` - dependencies: next 14.2.18, next-auth ^4.24.11, bcryptjs, tailwindcss, typescript
  - `tsconfig.json` - strict TypeScript config with `@/*` path alias
  - `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`
  - `.env.example` - documents NEXTAUTH_SECRET, NEXTAUTH_URL, AUTH_USERNAME, AUTH_PASSWORD_HASH, ANTHROPIC_API_KEY, DATABASE_URL
  - `middleware.ts` - protects all routes except auth/login/static
  - `src/lib/auth.ts` - NextAuth options with bcrypt credential verification
  - `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
  - `src/types/next-auth.d.ts` - Session type augmentation
  - `src/components/Providers.tsx` - SessionProvider wrapper
  - `src/components/Header.tsx` - Responsive header with mobile hamburger menu and logout
  - `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
  - `src/app/login/page.tsx` - Login form with credentials sign-in
  - `src/app/dashboard/page.tsx` - Placeholder dashboard page
- **Learnings**:
  - NextAuth v4 works with App Router via `src/app/api/auth/[...nextauth]/route.ts` exporting GET and POST handlers.
  - `next-auth/middleware` default export handles redirects automatically — just configure the matcher.
  - Bcrypt password hashes compared at runtime; users pre-generate AUTH_PASSWORD_HASH env var.
  - `getServerSession(authOptions)` server-side; `useSession()` client-side.
  - Next.js 14 does NOT support `next.config.ts` — must use `next.config.js` or `next.config.mjs`.
  - Use `next@14.2.35` or later (14.2.18 has security vulnerabilities per 2025-12-11 advisory).
---

