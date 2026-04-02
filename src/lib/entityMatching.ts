/**
 * @module entityMatching
 * Funciones de búsqueda difusa (fuzzy matching) para resolver entidades
 * (cuentas, categorías, contactos) por nombre. Soporta nombres con
 * acentos/diacríticos y coincidencias parciales.
 */

/** Entidad con identificador y nombre para búsqueda. */
export interface NamedEntity {
  id: string;
  name: string;
}

/**
 * Elimina diacríticos/acentos de un string.
 * @param value - String con posibles acentos (ej: `"café"`).
 * @returns String sin acentos (ej: `"cafe"`).
 * @internal
 */
function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza un nombre de entidad para comparación: elimina acentos,
 * convierte a minúsculas, y reemplaza caracteres especiales por espacios.
 *
 * @param value - Nombre original de la entidad.
 * @returns Nombre normalizado listo para comparación.
 *
 * @example
 * normalizeEntityName("Café León!") // → "cafe leon"
 */
export function normalizeEntityName(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resuelve el ID de una entidad buscando por nombre con coincidencia
 * exacta o parcial (fuzzy). Retorna `null` si no hay coincidencia
 * o si hay múltiples coincidencias parciales ambiguas.
 *
 * @param entities - Lista de entidades disponibles para buscar.
 * @param rawName - Nombre crudo ingresado por el usuario o IA.
 * @returns El `id` de la entidad encontrada, o `null` si no se resuelve.
 *
 * @example
 * resolveEntityIdByName([{ id: "1", name: "Banco Nacional" }], "banco nacional") // → "1"
 * resolveEntityIdByName([{ id: "1", name: "Banco Nacional" }], "banco")          // → "1" (coincidencia parcial única)
 */
export function resolveEntityIdByName(
  entities: NamedEntity[],
  rawName: string | null | undefined,
) {
  if (!rawName) return null;

  const normalizedTarget = normalizeEntityName(rawName);
  if (!normalizedTarget) return null;

  const normalizedEntities = entities.map((entity) => ({
    ...entity,
    normalizedName: normalizeEntityName(entity.name),
  }));

  const exactMatch = normalizedEntities.find(
    (entity) => entity.normalizedName === normalizedTarget,
  );
  if (exactMatch) return exactMatch.id;

  const partialMatches = normalizedEntities.filter(
    (entity) =>
      entity.normalizedName.includes(normalizedTarget) ||
      normalizedTarget.includes(entity.normalizedName),
  );

  return partialMatches.length === 1 ? partialMatches[0].id : null;
}
