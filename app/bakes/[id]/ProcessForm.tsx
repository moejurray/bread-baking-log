"use client";

import { useState, type WheelEvent } from "react";
import { saveProcess } from "./actions";

type ProcessStep = { step_type: string; description: string | null; duration_minutes: number | null; temperature_f: number | null };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null };

const defaultSteps: ProcessStep[] = [
  { step_type: "mixing", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "kneading", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "proofing", description: "First proof", duration_minutes: null, temperature_f: null },
  { step_type: "shaping", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "proofing", description: "Final proof", duration_minutes: null, temperature_f: null },
];

const defaultBaking: BakingStage[] = [
  { temperature_f: 450, duration_minutes: null, lid_on: true, description: "" },
  { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" },
];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

export default function ProcessForm({ bakeId, initialSteps, initialBaking }: { bakeId: string; initialSteps: ProcessStep[]; initialBaking: BakingStage[] }) {
  const [steps, setSteps] = useState(initialSteps.length ? initialSteps : defaultSteps);
  const [baking, setBaking] = useState(initialBaking.length ? initialBaking : defaultBaking);
  const action = saveProcess.bind(null, bakeId);

  function addStep() {
    setSteps((current) => [...current, { step_type: "proofing", description: "", duration_minutes: null, temperature_f: null }]);
  }

  function addBakingStage() {
    setBaking((current) => [...current, { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" }]);
  }

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-stone-900">Process</h2><p className="mt-1 text-sm text-stone-500">Record what you actually did.</p></div>
          <button type="button" onClick={addStep} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700">+ Step</button>
        </div>
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="rounded-2xl bg-stone-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-stone-700">Step
                  <select name="step_type" defaultValue={step.step_type} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base">
                    <option value="mixing">Mixing</option><option value="kneading">Kneading</option><option value="proofing">Proofing</option><option value="shaping">Shaping</option><option value="resting">Resting</option><option value="other">Other</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-stone-700">Minutes
                  <input name="step_duration" type="number" min="0" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium text-stone-700">What did you do?
                <input name="step_description" defaultValue={step.description ?? ""} placeholder="e.g. Stand mixer, speed 2" className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" />
              </label>
              <label className="mt-3 block text-sm font-medium text-stone-700">Temperature °F <span className="font-normal text-stone-400">(when useful)</span>
                <input name="step_temperature" type="number" step="0.1" defaultValue={step.temperature_f ?? ""} placeholder="76" onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-stone-900">Baking</h2><p className="mt-1 text-sm text-stone-500">Use separate stages for lid on/off or temperature changes.</p></div>
          <button type="button" onClick={addBakingStage} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700">+ Stage</button>
        </div>
        <div className="mt-4 space-y-4">
          {baking.map((stage, index) => (
            <div key={index} className="rounded-2xl bg-stone-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-stone-700">Oven °F<input name="bake_temperature" type="number" step="0.1" defaultValue={stage.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
                <label className="text-sm font-medium text-stone-700">Minutes<input name="bake_duration" type="number" min="0" defaultValue={stage.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
              </div>
              <div className="mt-3 grid grid-cols-[9rem_1fr] gap-3">
                <label className="text-sm font-medium text-stone-700">Lid
                  <select name="bake_lid" defaultValue={stage.lid_on ? "on" : "off"} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="on">On</option><option value="off">Off</option></select>
                </label>
                <label className="text-sm font-medium text-stone-700">Note<input name="bake_description" defaultValue={stage.description ?? ""} placeholder="Optional" className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" className="min-h-12 w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">Save Process</button>
    </form>
  );
}
