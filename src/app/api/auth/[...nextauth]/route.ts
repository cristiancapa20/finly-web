/**
 * @module api/auth/[...nextauth]
 * Manejador de rutas dinámicas para NextAuth.js. Configura los endpoints de autenticación (signin, signout, callback, etc.) usando las opciones de autenticación definidas.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

/**
 * GET /api/auth/[...nextauth]
 * Maneja todas las solicitudes GET de autenticación (signin, signout, callback, etc.)
 * @returns {Object} Respuesta del handler de NextAuth.js
 */
export { handler as GET };

/**
 * POST /api/auth/[...nextauth]
 * Maneja todas las solicitudes POST de autenticación (signin, signout, callback, etc.)
 * @returns {Object} Respuesta del handler de NextAuth.js
 */
export { handler as POST };
