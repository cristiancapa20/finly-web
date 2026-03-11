interface NamedEntity {
  id: string;
  name: string;
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeEntityName(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
