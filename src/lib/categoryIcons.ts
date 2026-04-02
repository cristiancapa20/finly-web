/**
 * @module categoryIcons
 * Mapeo de categorías de transacción a íconos de Lucide React.
 * Usa keywords en español para hacer match con nombres de categorías
 * definidas por el usuario o el sistema.
 */

import {
  Utensils,
  Coffee,
  Car,
  Heart,
  ShoppingBag,
  Home,
  Briefcase,
  Plane,
  Dumbbell,
  BookOpen,
  Zap,
  Music,
  PiggyBank,
  Tag,
  Laptop,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Mapeo interno de keywords a íconos. Cada entrada define un conjunto
 * de palabras clave en español que, si aparecen en el nombre de la categoría,
 * determinan el ícono a mostrar.
 * @internal
 */
const categoryIconMap: { keywords: string[]; Icon: LucideIcon }[] = [
  { keywords: ["comida", "aliment", "restaur", "super", "mercado", "taco", "pizza"], Icon: Utensils },
  { keywords: ["café", "cafe", "coffee"], Icon: Coffee },
  { keywords: ["transport", "auto", "carro", "gasolina", "uber", "taxi", "bus"], Icon: Car },
  { keywords: ["salud", "médic", "medic", "farmac", "doctor", "hospital"], Icon: Heart },
  { keywords: ["ropa", "vestim", "moda", "tienda", "shopping", "compra"], Icon: ShoppingBag },
  { keywords: ["tecnolog", "laptop", "celular", "telefono", "teléfono", "comput", "electro", "gadget", "movil", "móvil"], Icon: Laptop },
  { keywords: ["vivienda", "hogar", "casa", "renta", "rent", "mueble", "limpiez", "departamento", "depa"], Icon: Home },
  { keywords: ["trabajo", "sueldo", "salario", "nómina", "nomina", "ingreso", "ingres"], Icon: Briefcase },
  { keywords: ["viaje", "vuelo", "hotel", "vacacion"], Icon: Plane },
  { keywords: ["deporte", "gym", "gimnasio", "ejercicio"], Icon: Dumbbell },
  { keywords: ["educac", "escuela", "curso", "libro", "univers"], Icon: BookOpen },
  { keywords: ["servic", "luz", "agua", "internet", "teléfon", "telefon"], Icon: Zap },
  { keywords: ["musica", "música", "spotify", "netflix", "suscripc", "entret"], Icon: Music },
  { keywords: ["ahorro", "invers", "fondo"], Icon: PiggyBank },
];

/**
 * Retorna el ícono de Lucide React que mejor representa una categoría
 * según su nombre. Busca coincidencias parciales con keywords en español.
 *
 * @param name - Nombre de la categoría (ej: `"Comida y restaurantes"`).
 * @returns Componente de ícono Lucide. Retorna `Tag` como fallback si no hay match.
 *
 * @example
 * getCategoryIcon("Comida rápida")  // → Utensils
 * getCategoryIcon("Gym mensual")    // → Dumbbell
 * getCategoryIcon("Algo random")    // → Tag (fallback)
 */
export function getCategoryIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const { keywords, Icon } of categoryIconMap) {
    if (keywords.some((k) => lower.includes(k))) return Icon;
  }
  return Tag;
}
