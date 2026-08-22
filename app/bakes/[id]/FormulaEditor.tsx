"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type WheelEvent } from "react";
import { saveFormula } from "./formula-actions";

type Ingredient = { ingredient_type: string; name: string; grams: number; sort_order?: number };
type FlourRow = { id: number; name: string; custom: string; grams: string };

const flourOptions = ["Bread flour", "All-purpose flour", "Whole wheat flour", "Other"];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

export default function FormulaEditor({ bakeId, initialIngredients, defaultOpen = false }: { bakeId: string; initialIngredients: Ingredient[]; defaultOpen?: boolean }) {
  const initialFlours = initialIngredients.filter((item) => item.ingredient_type === "flour");
  const water = initialIngredients.find((item) => item.ingredient_type === "water");
  const salt = initialIngredients.find((item) => item.ingredient_type === "salt");
  const yeast = initialIngredients.find((item) => item.ingredient_type === "yeast");

  const [open, setOpen] = useState(defaultOpen);
  const [flours, setFlours] = useState<FlourRow[]>(initialFlours.map((item, index) => ({
    id: index + 1,
    name: flourOptions.includes(item.name) ? item.name : "Other",
    custom: flourOptions.includes(item.name) ? "" : item.name,
    grams: String(item.grams),
  })));
  const [waterGrams, setWaterGrams] = useState(String(water?.grams ?? ""));
  const [saltGrams, setSaltGrams] = useState(String(salt?.grams ?? ""));
  const [yeastGrams, setYeastGrams] = useState(String(yeast?.grams ?? ""));
  const [yeastType, setYeastType] = useState(yeast?.name ?? "Instant yeast");
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const totalFlour = useMemo(() => flours.reduce((sum, flour) => sum + (Number(flour.grams) || 0), 0), [flours]);
  const hydration = totalFlour > 0 ? ((Number(waterGrams) || 0) / totalFlour) * 100 : 0;

  async function saveNow() {
    if (!formRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("saving");
    setError("");
    const result = await saveFormula(bakeId, new FormData(formRef.current));
    if (result.ok) setStatus("saved");
    else { setStatus("error"); setError(result.error ?? "Could not save formula."); }
  }

  function scheduleSave() {
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveNow, 900);
  }

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flours, waterGrams, saltGrams, yeastGrams, yeastType]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function updateFlour(id: number, field: keyof Omit<FlourRow, "id">, value: string) {
    setFlours((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row));
  }

  function addFlour() {
    setFlours((rows) => [...rows, { id: Math.max(...rows.map((row) => row.id), 0) + 1, name: "Bread flour", custom: "", grams: "" }]);
  }

  function removeFlour(id: number) {
    setFlours((rows) => rows.filter((row) => row.id !== id));
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.name) scheduleSave();
  }

  return (
    <section className="mb-6 rounded-3xl border border-stone-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between p-5 text-left">
        <div>
          <h2 className="text-lg font-semibold">Formula</h2>
          <p className="mt-1 text-sm text-stone-500">{totalFlour}g flour · {hydration.toFixed(1)}% hydration</p>
        </div>
        <span className="text-xl text-stone-400">{open ? "−" : "+"}</span>
      </button>

      <form ref={formRef} onInput={handleInput} onChange={handleInput} className={open ? "border-t border-stone-100 p-5" : "hidden"}>
        <div className="mb-4 flex justify-end"><span className={`text-xs font-semibold ${status === "error" ? "text-red-700" : "text-stone-500"}`}>{status === "saving" ? "Saving…" : status === "pending" ? "Changes pending…" : status === "error" ? `Not saved: ${error}` : "✓ Saved"}</span></div>

        <div className="space-y-4">
          {flours.map((flour, index) => (
            <div key={flour.id} className="rounded-2xl bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-stone-700">Flour {index + 1}</span>{flours.length > 1 ? <button type="button" onClick={() => removeFlour(flour.id)} className="text-sm font-medium text-stone-500">Remove</button> : null}</div>
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <select name="flour_name" value={flour.name} onChange={(event) => updateFlour(flour.id, "name", event.target.value)} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-base">{flourOptions.map((option) => <option key={option}>{option}</option>)}</select>
                <div className="relative"><input name="flour_grams" type="number" min="0" step="0.1" value={flour.grams} onChange={(event) => updateFlour(flour.id, "grams", event.target.value)} onWheel={preventWheelChange} className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 pr-8 text-base" /><span className="pointer-events-none absolute right-3 top-3 text-stone-400">g</span></div>
              </div>
              {flour.name === "Other" ? <input name="flour_custom" value={flour.custom} onChange={(event) => updateFlour(flour.id, "custom", event.target.value)} placeholder="Flour name" className="mt-3 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /> : <input type="hidden" name="flour_custom" value="" />}
            </div>
          ))}
        </div>

        <button type="button" onClick={addFlour} className="mt-4 min-h-11 w-full rounded-xl border border-dashed border-stone-400 bg-stone-50 px-4 font-semibold text-stone-700">+ Add flour</button>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="text-sm font-medium text-stone-700">Water<input name="water_grams" type="number" min="0" step="0.1" value={waterGrams} onChange={(event) => setWaterGrams(event.target.value)} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label>
          <label className="text-sm font-medium text-stone-700">Salt<input name="salt_grams" type="number" min="0" step="0.1" value={saltGrams} onChange={(event) => setSaltGrams(event.target.value)} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_7rem] gap-3">
          <label className="text-sm font-medium text-stone-700">Yeast type<select name="yeast_type" value={yeastType} onChange={(event) => setYeastType(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3"><option>Instant yeast</option><option>Active dry yeast</option><option>Fresh yeast</option></select></label>
          <label className="text-sm font-medium text-stone-700">Yeast<input name="yeast_grams" type="number" min="0" step="0.1" value={yeastGrams} onChange={(event) => setYeastGrams(event.target.value)} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label>
        </div>
      </form>
    </section>
  );
}
