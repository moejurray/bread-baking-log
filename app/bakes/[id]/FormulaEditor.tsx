"use client";

import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import { saveFormula } from "./formula-actions";
import { compileFormulaNotes, FORMULA_NOTES_EVENT } from "./process-notes";
import { roundGrams, toGrams, unitsByKind } from "./units";

type Ingredient = { ingredient_type: string; name: string; grams: number; sort_order?: number; amount?: number | null; unit?: string | null; note?: string | null };
type Kind = "flour" | "water" | "salt" | "yeast" | "other";
type Row = { id: number; type: Kind; choice: string; custom: string; amount: string; unit: string; note: string };

const flourOptions = ["Bread flour", "All-purpose flour", "Whole wheat flour", "Other"];
const yeastOptions = ["Instant yeast", "Active dry yeast", "Fresh yeast"];
const otherOptions = ["Milk", "Butter", "Eggs", "Sugar", "Honey", "Olive oil", "Milk powder", "Other"];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) { event.currentTarget.blur(); }

function resolvedName(row: Row) {
  if (row.type === "water") return "Water";
  if (row.type === "salt") return "Salt";
  if ((row.type === "flour" || row.type === "other") && row.choice === "Other") return row.custom.trim();
  return row.choice;
}

function rowGrams(row: Row) { return toGrams(Number(row.amount), row.unit, resolvedName(row)); }

function rowFromIngredient(item: Ingredient, id: number): Row {
  const type = (["flour", "water", "salt", "yeast", "other"].includes(item.ingredient_type) ? item.ingredient_type : "other") as Kind;
  const options = type === "flour" ? flourOptions : type === "other" ? otherOptions : null;
  const known = !options || options.includes(item.name);
  const unit = item.unit && unitsByKind[type].includes(item.unit as never) ? item.unit : "g";
  const amount = item.amount !== null && item.amount !== undefined && item.unit ? Number(item.amount) : Number(item.grams);
  return { id, type, choice: known ? item.name : "Other", custom: known ? "" : item.name, amount: String(amount), unit, note: item.note ?? "" };
}

function buildInitialRows(initial: Ingredient[]): Row[] {
  const rows = initial.map((item, index) => rowFromIngredient(item, index + 1));
  let nextId = rows.length + 1;
  if (!rows.some((row) => row.type === "flour")) rows.unshift({ id: nextId++, type: "flour", choice: "Bread flour", custom: "", amount: "", unit: "g", note: "" });
  if (!rows.some((row) => row.type === "water")) rows.push({ id: nextId++, type: "water", choice: "Water", custom: "", amount: "", unit: "g", note: "" });
  if (!rows.some((row) => row.type === "salt")) rows.push({ id: nextId++, type: "salt", choice: "Salt", custom: "", amount: "", unit: "g", note: "" });
  if (!rows.some((row) => row.type === "yeast")) rows.push({ id: nextId++, type: "yeast", choice: "Instant yeast", custom: "", amount: "", unit: "g", note: "" });
  return rows;
}

function NoteButton({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(event: PointerEvent) { const d = detailsRef.current; if (d?.open && event.target instanceof Node && !d.contains(event.target)) d.open = false; }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return <details ref={detailsRef} className="relative inline-block align-middle">
    <summary title="Add note" aria-label={`Note about ${label}`} className={`inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border text-sm ${value.trim() ? "border-stone-700 bg-stone-800 text-white" : "border-stone-300 bg-white text-stone-500"}`}>✎</summary>
    <div className="fixed left-4 right-4 top-1/2 z-50 -translate-y-1/2 rounded-xl border border-stone-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-72 sm:translate-y-0 sm:p-3">
      <div className="mb-2 text-xs font-semibold text-stone-700">Note about {label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Brand, temperature, substitutions…" rows={3} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-normal text-stone-800" />
      <div className="mt-1 text-[11px] font-normal text-stone-400">Autosaves. Tap anywhere outside this note to close it.</div>
    </div>
  </details>;
}

export default function FormulaEditor({ bakeId, initialIngredients, defaultOpen = false }: { bakeId: string; initialIngredients: Ingredient[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [rows, setRows] = useState<Row[]>(() => buildInitialRows(initialIngredients));
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved"); const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null); const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); const firstRender = useRef(true); const selectInUseRef = useRef(false);

  const totalFlour = useMemo(() => roundGrams(rows.filter((row) => row.type === "flour").reduce((sum, row) => sum + rowGrams(row), 0)), [rows]);
  const waterGrams = useMemo(() => roundGrams(rows.filter((row) => row.type === "water").reduce((sum, row) => sum + rowGrams(row), 0)), [rows]);
  const hydration = totalFlour > 0 ? (waterGrams / totalFlour) * 100 : 0;

  function clearSaveTimer() { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } }
  async function saveNow() {
    if (!formRef.current) return;
    if (selectInUseRef.current || document.activeElement instanceof HTMLSelectElement) { clearSaveTimer(); timerRef.current = setTimeout(saveNow, 700); return; }
    clearSaveTimer(); setStatus("saving"); setError("");
    const result = await saveFormula(bakeId, new FormData(formRef.current));
    if (result.ok) setStatus("saved"); else { setStatus("error"); setError(result.error ?? "Could not save formula."); }
  }
  function scheduleSave() { setStatus("pending"); clearSaveTimer(); timerRef.current = setTimeout(saveNow, 900); }
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.dispatchEvent(new CustomEvent(FORMULA_NOTES_EVENT, { detail: compileFormulaNotes(rows.map((row) => ({ name: resolvedName(row), note: row.note }))) }));
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  useEffect(() => () => clearSaveTimer(), []);

  function update(id: number, patch: Partial<Row>) { setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row)); }
  function nextId() { return Math.max(...rows.map((row) => row.id), 0) + 1; }
  function addFlour() {
    const lastFlour = rows.reduce((last, row, index) => row.type === "flour" ? index : last, -1);
    const copy = [...rows]; copy.splice(lastFlour + 1, 0, { id: nextId(), type: "flour", choice: "Bread flour", custom: "", amount: "", unit: rows[lastFlour]?.unit ?? "g", note: "" }); setRows(copy);
  }
  function addOther(choice: string) { if (!choice) return; setRows((current) => [...current, { id: nextId(), type: "other", choice, custom: "", amount: "", unit: "g", note: "" }]); }
  function remove(id: number) { setRows((current) => current.filter((row) => row.id !== id)); }
  function beginSelect() { selectInUseRef.current = true; clearSaveTimer(); } function endSelect() { selectInUseRef.current = false; scheduleSave(); }
  const selectEvents = { onPointerDown: beginSelect, onFocus: beginSelect, onBlur: endSelect };

  const flourRows = rows.filter((row) => row.type === "flour");
  const otherRows = rows.filter((row) => row.type === "other");
  const field = "min-h-12 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 text-base";

  function amountField(row: Row) {
    const grams = roundGrams(rowGrams(row));
    return <div className="min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] gap-2">
        <input name="ing_amount" type="number" min="0" step="any" inputMode="decimal" aria-label={`${resolvedName(row) || "Ingredient"} amount`} value={row.amount} onChange={(e) => update(row.id, { amount: e.target.value })} onWheel={preventWheelChange} className={field} />
        <select name="ing_unit" aria-label="Unit" value={row.unit} {...selectEvents} onChange={(e) => { update(row.id, { unit: e.target.value }); selectInUseRef.current = false; }} className="min-h-12 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-1.5 text-sm font-medium">{unitsByKind[row.type].map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select>
      </div>
      {row.unit !== "g" && grams > 0 ? <div className="mt-1 text-xs text-stone-500">≈ {grams}g</div> : null}
    </div>;
  }

  function hiddenFields(row: Row) {
    return <><input type="hidden" name="ing_type" value={row.type} /><input type="hidden" name="ing_name" value={resolvedName(row)} /><input type="hidden" name="ing_note" value={row.note} /></>;
  }

  function simpleRow(row: Row, label: string) {
    return <div key={row.id} className="rounded-2xl bg-stone-50 p-4">
      {hiddenFields(row)}
      <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-stone-700">{label}</span><NoteButton value={row.note} label={label} onChange={(note) => update(row.id, { note })} /></div>
      {row.type === "yeast" ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem]"><select aria-label="Yeast type" value={row.choice} {...selectEvents} onChange={(e) => { update(row.id, { choice: e.target.value }); selectInUseRef.current = false; }} className={field}>{yeastOptions.map((option) => <option key={option}>{option}</option>)}</select>{amountField(row)}</div> : amountField(row)}
    </div>;
  }

  return <section className="mb-6 rounded-3xl border border-stone-200 bg-white shadow-sm">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between p-5 text-left"><div><h2 className="text-lg font-semibold">Formula</h2><p className="mt-1 text-sm text-stone-500">{totalFlour}g flour · {hydration.toFixed(1)}% hydration{otherRows.length ? ` · +${otherRows.length} other` : ""}</p></div><span className="text-xl text-stone-400">{open ? "−" : "+"}</span></button>
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className={open ? "border-t border-stone-100 p-5" : "hidden"}>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"><div><div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Live hydration</div><div className="mt-1 text-2xl font-semibold text-stone-900">{hydration.toFixed(1)}%</div><div className="text-xs text-stone-500">{waterGrams}g water ÷ {totalFlour}g flour</div></div><span className={`text-right text-xs font-semibold ${status === "error" ? "text-red-700" : "text-stone-500"}`}>{status === "saving" ? "Saving…" : status === "pending" ? "Changes pending…" : status === "error" ? `Not saved: ${error}` : "✓ Saved"}</span></div>

      <div className="space-y-4">{flourRows.map((row, index) => <div key={row.id} className="rounded-2xl bg-stone-50 p-4">
        {hiddenFields(row)}
        <div className="mb-3 flex items-center justify-between gap-2"><span className="text-sm font-semibold text-stone-700">Flour {index + 1}</span><div className="flex items-center gap-3">{flourRows.length > 1 ? <button type="button" onClick={() => remove(row.id)} className="text-sm font-medium text-stone-500">Remove</button> : null}<NoteButton value={row.note} label={`Flour ${index + 1}`} onChange={(note) => update(row.id, { note })} /></div></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem]"><select aria-label="Flour type" value={row.choice} {...selectEvents} onChange={(e) => { update(row.id, { choice: e.target.value }); selectInUseRef.current = false; }} className={field}>{flourOptions.map((option) => <option key={option}>{option}</option>)}</select>{amountField(row)}</div>
        {row.choice === "Other" ? <input value={row.custom} onChange={(e) => update(row.id, { custom: e.target.value })} placeholder="Flour name" className={`mt-3 ${field}`} /> : null}
      </div>)}</div>
      <button type="button" onClick={addFlour} className="mt-4 min-h-11 w-full rounded-xl border border-dashed border-stone-400 bg-stone-50 px-4 font-semibold text-stone-700">+ Add flour</button>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">{rows.filter((row) => row.type === "water" || row.type === "salt").map((row) => simpleRow(row, row.type === "water" ? "Water" : "Salt"))}</div>
      <div className="mt-4">{rows.filter((row) => row.type === "yeast").map((row) => simpleRow(row, "Yeast"))}</div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Other ingredients</h3>
        <div className="space-y-4">{otherRows.map((row) => <div key={row.id} className="rounded-2xl bg-stone-50 p-4">
          {hiddenFields(row)}
          <div className="mb-3 flex items-center justify-between gap-2"><span className="text-sm font-semibold text-stone-700">{resolvedName(row) || "Other ingredient"}</span><div className="flex items-center gap-3"><button type="button" onClick={() => remove(row.id)} className="text-sm font-medium text-stone-500">Remove</button><NoteButton value={row.note} label={resolvedName(row) || "this ingredient"} onChange={(note) => update(row.id, { note })} /></div></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem]"><select aria-label="Ingredient" value={row.choice} {...selectEvents} onChange={(e) => { update(row.id, { choice: e.target.value }); selectInUseRef.current = false; }} className={field}>{otherOptions.map((option) => <option key={option}>{option}</option>)}</select>{amountField(row)}</div>
          {row.choice === "Other" ? <input value={row.custom} onChange={(e) => update(row.id, { custom: e.target.value })} placeholder="Ingredient name" className={`mt-3 ${field}`} /> : null}
        </div>)}</div>
        <select aria-label="Add another ingredient" value="" onChange={(e) => addOther(e.target.value)} className="mt-4 min-h-11 w-full rounded-xl border border-dashed border-stone-400 bg-stone-50 px-4 font-semibold text-stone-700">
          <option value="">+ Add other ingredient…</option>
          {otherOptions.map((option) => <option key={option} value={option}>{option === "Other" ? "Something else…" : option}</option>)}
        </select>
        <p className="mt-2 text-xs text-stone-500">Volume measures (cups, tbsp, tsp) are converted to grams with typical densities for known ingredients. Other ingredients don&apos;t count toward hydration.</p>
      </div>
    </form>
  </section>;
}
