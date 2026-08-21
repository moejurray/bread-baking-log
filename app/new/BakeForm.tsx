"use client";

import { useState, type WheelEvent } from "react";
import { createBake } from "./actions";

type FlourRow = { id: number; name: string; custom: string; grams: string };

const flourOptions = ["Bread flour", "All-purpose flour", "Whole wheat flour", "Other"];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

export default function BakeForm({ error }: { error?: string }) {
  const [flours, setFlours] = useState<FlourRow[]>([
    { id: 1, name: "Bread flour", custom: "", grams: "" },
  ]);

  function updateFlour(id: number, field: keyof Omit<FlourRow, "id">, value: string) {
    setFlours((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function addFlour() {
    setFlours((rows) => [
      ...rows,
      { id: Math.max(...rows.map((row) => row.id), 0) + 1, name: "Bread flour", custom: "", grams: "" },
    ]);
  }

  function removeFlour(id: number) {
    setFlours((rows) => rows.filter((row) => row.id !== id));
  }

  return (
    <form action={createBake} className="space-y-6 pb-28">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Bake</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-stone-700">Bake name</label>
            <input id="name" name="name" required placeholder="Friday sandwich loaf" className="min-h-12 w-full rounded-xl border border-stone-300 px-4 text-base outline-none focus:border-stone-600" />
          </div>
          <div>
            <label htmlFor="bake_date" className="mb-2 block text-sm font-medium text-stone-700">Date</label>
            <input id="bake_date" name="bake_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="min-h-12 w-full rounded-xl border border-stone-300 px-4 text-base outline-none focus:border-stone-600" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Flour</h2>
            <p className="mt-1 text-sm text-stone-500">Add each flour separately.</p>
          </div>
          <button type="button" onClick={addFlour} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700">+ Flour</button>
        </div>

        <div className="mt-4 space-y-4">
          {flours.map((flour, index) => (
            <div key={flour.id} className="rounded-2xl bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-700">Flour {index + 1}</span>
                {flours.length > 1 ? (
                  <button type="button" onClick={() => removeFlour(flour.id)} className="text-sm font-medium text-stone-500">Remove</button>
                ) : null}
              </div>
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <select name="flour_name" value={flour.name} onChange={(event) => updateFlour(flour.id, "name", event.target.value)} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-base">
                  {flourOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <div className="relative">
                  <input name="flour_grams" type="number" min="0" step="0.1" inputMode="decimal" value={flour.grams} onChange={(event) => updateFlour(flour.id, "grams", event.target.value)} onWheel={preventWheelChange} placeholder="500" className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 pr-8 text-base" />
                  <span className="pointer-events-none absolute right-3 top-3 text-stone-400">g</span>
                </div>
              </div>
              {flour.name === "Other" ? (
                <input name="flour_custom" value={flour.custom} onChange={(event) => updateFlour(flour.id, "custom", event.target.value)} placeholder="Flour name" className="mt-3 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" />
              ) : (
                <input type="hidden" name="flour_custom" value="" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Water, salt & yeast</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-sm font-medium text-stone-700">Water
            <div className="relative mt-2"><input name="water_grams" type="number" min="0" step="0.1" inputMode="decimal" onWheel={preventWheelChange} placeholder="350" className="min-h-12 w-full rounded-xl border border-stone-300 px-3 pr-8 text-base" /><span className="pointer-events-none absolute right-3 top-3 text-stone-400">g</span></div>
          </label>
          <label className="text-sm font-medium text-stone-700">Salt
            <div className="relative mt-2"><input name="salt_grams" type="number" min="0" step="0.1" inputMode="decimal" onWheel={preventWheelChange} placeholder="10" className="min-h-12 w-full rounded-xl border border-stone-300 px-3 pr-8 text-base" /><span className="pointer-events-none absolute right-3 top-3 text-stone-400">g</span></div>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_7rem] gap-3">
          <label className="text-sm font-medium text-stone-700">Yeast type
            <select name="yeast_type" className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base">
              <option>Instant yeast</option><option>Active dry yeast</option><option>Fresh yeast</option>
            </select>
          </label>
          <label className="text-sm font-medium text-stone-700">Yeast
            <div className="relative mt-2"><input name="yeast_grams" type="number" min="0" step="0.1" inputMode="decimal" onWheel={preventWheelChange} placeholder="4" className="min-h-12 w-full rounded-xl border border-stone-300 px-3 pr-8 text-base" /><span className="pointer-events-none absolute right-3 top-3 text-stone-400">g</span></div>
          </label>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-md sm:max-w-2xl">
          <button type="submit" className="min-h-12 w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">Save Bake</button>
        </div>
      </div>
    </form>
  );
}
