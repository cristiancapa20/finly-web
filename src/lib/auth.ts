/**
 * @module auth
 * Configuración de autenticación con NextAuth.js usando estrategia JWT
 * y proveedor de credenciales (email + contraseña).
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Opciones de configuración de NextAuth para la aplicación.
 *
 * - **Proveedor**: Credenciales (email/password) con bcrypt para hash comparison.
 * - **Estrategia de sesión**: JWT (sin base de datos de sesiones).
 * - **Callbacks**: Inyecta `user.id` en el token JWT y en el objeto `session`.
 * - **Página de login personalizada**: `/login`.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.displayName ?? user.email,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id;
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
