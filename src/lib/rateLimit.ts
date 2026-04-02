/**
 * @module rateLimit
 * Rate limiter en memoria basado en ventana fija (fixed window).
 * Ideal para proteger endpoints de API contra abuso.
 * Nota: El store se reinicia al redeployar (no es distribuido).
 */

/** Configuración para el rate limiter. */
export type RateLimitConfig = {
  /** Número máximo de requests permitidos por ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
};

/** Resultado de un intento de consumo de rate limit. */
export type RateLimitResult = {
  /** `true` si el request fue permitido. */
  allowed: boolean;
  /** Requests restantes en la ventana actual. */
  remaining: number;
  /** Segundos hasta que se renueve la ventana (útil para header `Retry-After`). */
  retryAfterSeconds: number;
};

/** @internal */
type RateLimitEntry = {
  count: number;
  resetAt: number;
};

/** Store en memoria para tracking de rate limits por key. */
const store = new Map<string, RateLimitEntry>();

/** @internal */
function nowMs() {
  return Date.now();
}

/**
 * Consume un intento de rate limit para la key dada.
 * Si la ventana expiró, se crea una nueva. Si el límite fue alcanzado,
 * el request es denegado.
 *
 * @param key - Identificador único (típicamente IP + ruta del endpoint).
 * @param config - Configuración de límite y ventana.
 * @returns Resultado indicando si el request fue permitido y cuántos intentos quedan.
 *
 * @example
 * const result = consumeRateLimit("192.168.1.1:/api/login", { limit: 5, windowMs: 60000 });
 * if (!result.allowed) {
 *   return new Response("Too many requests", { status: 429 });
 * }
 */
export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = nowMs();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(config.limit - 1, 0),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(config.limit - current.count, 0),
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
}

/**
 * Extrae la IP del cliente desde los headers HTTP.
 * Revisa `X-Forwarded-For` (primer IP) y `X-Real-IP` como fallback.
 *
 * @param headers - Objeto Headers del request.
 * @returns IP del cliente como string, o `"unknown"` si no se puede determinar.
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
