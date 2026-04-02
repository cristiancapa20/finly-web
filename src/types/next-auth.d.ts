/**
 * @module next-auth.d.ts
 * Extensión de tipos para NextAuth con campos personalizados del usuario.
 */

import { DefaultSession } from "next-auth";

/**
 * Extiende la sesión de NextAuth con propiedades personalizadas.
 * @global
 */
declare module "next-auth" {
  /**
   * Sesión extendida del usuario
   * @interface Session
   * @property {Object} user - Datos del usuario autenticado
   * @property {string} user.id - ID único del usuario en la base de datos
   * @property {string|null} [user.displayName] - Nombre para mostrar personalizado (opcional)
   */
  interface Session {
    user: {
      /** ID único del usuario en la base de datos */
      id: string;
      /** Nombre para mostrar personalizado (opcional) */
      displayName?: string | null;
    } & DefaultSession["user"];
  }
}
