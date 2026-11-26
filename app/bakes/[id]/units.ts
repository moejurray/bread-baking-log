// Shared measurement helpers for the Formula section.
// Amounts are entered in the baker's chosen unit and always stored as grams too,
// so hydration and summaries keep working regardless of the unit used.

export type Unit = "g" | "kg" | "oz" | "lb" | "ml" | "fl oz" | "cup" | "tbsp" | "tsp";

const weightUnits: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const volumeUnits: Record<string, number> = { ml: 1, "fl oz": 29.5735, cup: 236.588, tbsp: 14.7868, tsp: 4.92892 };

export const unitsByKind: Record<string, Unit[]> = {
  flour: ["g", "kg", "oz", "lb"],
  water: ["g", "kg", "oz", "lb", "ml", "fl oz", "cup", "tbsp"],
  salt: ["g", "oz", "tsp", "tbsp"],
  yeast: ["g", "oz", "tsp", "tbsp"],
  other: ["g", "kg", "oz", "lb", "ml", "fl oz", "cup", "tbsp", "tsp"],
};

// Approximate grams per millilitre, used only when a volume unit is chosen.
const densities: Record<string, number> = {
  water: 1, milk: 1.03, buttermilk: 1.03, butter: 0.911, egg: 1.03, eggs: 1.03, "egg yolk": 1.03,
  sugar: 0.85, "brown sugar": 0.93, honey: 1.42, "maple syrup": 1.33, "olive oil": 0.92, oil: 0.92, "vegetable oil": 0.92,
  salt: 1.22, "instant yeast": 0.63, "active dry yeast": 0.63, "fresh yeast": 0.6, "milk powder": 0.5, yogurt: 1.03, cream: 1.0,
};

export function isVolume(unit: string) { return unit in volumeUnits; }

export function toGrams(amount: number, unit: string, ingredientName: string) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (unit in weightUnits) return amount * weightUnits[unit];
  if (unit in volumeUnits) return amount * volumeUnits[unit] * (densities[ingredientName.trim().toLowerCase()] ?? 1);
  return amount;
}

export function roundGrams(grams: number) { return Math.round(grams * 10) / 10; }

export function formatAmount(amount: number, unit: string) { return `${Number(amount.toFixed(2))}${unit === "g" || unit === "kg" || unit === "ml" ? "" : " "}${unit}`; }
