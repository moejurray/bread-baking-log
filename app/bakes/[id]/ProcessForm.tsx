"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import { saveProcess } from "./actions";

type ProcessStep = { step_type: string; description: string | null; duration_minutes: number | null; temperature_f: number | null };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null };
type SaveState = "saved" | "saving" | "unsaved" | "error";
type SectionName = "process" | "baking" | "cooling";

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
const coolingNames = ["Cooling in Dutch oven", "Cooling on rack"];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) { event.currentTarget.blur(); }

export default function ProcessForm({ bakeId, initialSteps, initialBaking, initialCooling }: { bakeId: string; initialSteps: ProcessStep[]; initialBaking: BakingStage[]; initialCooling: ProcessStep[] }) {
  const [steps, setSteps] = useState(initialSteps.length ? initialSteps : defaultSteps);
  const [baking, setBaking] = useState(initialBaking.length ? initialBaking : defaultBaking);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchTargetIndex, setTouchTargetIndex] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const [openSection, setOpenSection] = useState<SectionName | null>(initialCooling.some((step) => step.duration_minutes !== null) ? "cooling" : initialBaking.some((stage) => stage.duration_minutes !== null) ? "baking" : "process");

  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const touchFromRef = useRef<number | null>(null);
  const touchOverRef = useRef<number | null>(null);

  const cooling = coolingNames.map((name) => initialCooling.find((step) => step.description === name) ?? { step_type: "resting", description: name, duration_minutes: null, temperature_f: null });

  async function saveNow() {
    if (!formRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState("saving"); setSaveError("");
    const result = await saveProcess(bakeId, new FormData(formRef.current));
    if (result.ok) setSaveState("saved"); else { setSaveState("error"); setSaveError(result.error ?? "Could not save."); }
  }
  function scheduleSave() { setSaveState("unsaved"); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(saveNow, 900); }
  useEffect(() => { if (firstRender.current) { firstRender.current = false; return; } scheduleSave(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [steps, baking]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  function handleChange(event: FormEvent<HTMLFormElement>) { const target = event.target as HTMLInputElement | HTMLSelectElement; if (target.name) scheduleSave(); }

  function addStep() { setSteps((current) => [...current, { step_type: "other", description: "", duration_minutes: null, temperature_f: null }]); }
  function deleteStep(index: number) { setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index)); }
  function moveStep(from: number, to: number) {
    if (to < 0 || to >= steps.length || from === to) return;
    setSteps((current) => { const next = [...current]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; });
  }
  function dropStep(event: DragEvent<HTMLDivElement>, index: number) { event.preventDefault(); if (draggedIndex !== null) moveStep(draggedIndex, index); setDraggedIndex(null); }

  function beginTouchDrag(event: ReactPointerEvent<HTMLSpanElement>, index: number) {
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    touchFromRef.current = index;
    touchOverRef.current = index;
    setTouchTargetIndex(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function continueTouchDrag(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "mouse" || touchFromRef.current === null) return;
    event.preventDefault();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const stepCard = element?.closest<HTMLElement>("[data-step-index]");
    if (!stepCard) return;
    const index = Number(stepCard.dataset.stepIndex);
    if (Number.isInteger(index)) { touchOverRef.current = index; setTouchTargetIndex(index); }
  }
  function endTouchDrag(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "mouse" || touchFromRef.current === null) return;
    event.preventDefault();
    const from = touchFromRef.current;
    const to = touchOverRef.current ?? from;
    touchFromRef.current = null; touchOverRef.current = null; setTouchTargetIndex(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    moveStep(from, to);
  }

  function addBakingStage() { setBaking((current) => [...current, { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" }]); }
  function deleteBakingStage(index: number) { setBaking((current) => current.filter((_, itemIndex) => itemIndex !== index)); }
  function toggleSection(section: SectionName) { setOpenSection((current) => (current === section ? null : section)); }
  function sectionHeader(title: string, subtitle: string, section: SectionName) {
    const isOpen = openSection === section;
    return <button type="button" onClick={() => toggleSection(section)} className="flex w-full items-center justify-between p-5 text-left" aria-expanded={isOpen}><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-stone-500">{subtitle}</p></div><span className="text-xl text-stone-400">{isOpen ? "−" : "+"}</span></button>;
  }

  return <form ref={formRef} onChange={handleChange} className="space-y-4">
    <div className="sticky top-3 z-10 flex justify-end pointer-events-none"><div className={`rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-sm ${saveState === "error" ? "border-red-200 text-red-700" : "border-stone-200 text-stone-600"}`}>{saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Changes pending…" : saveState === "error" ? `Not saved: ${saveError}` : "✓ Saved"}</div></div>

    <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
      {sectionHeader("Process", openSection === "process" ? "Drag steps by ☰ or use the arrows to put them in order." : `${steps.length} process steps`, "process")}
      <div className={openSection === "process" ? "border-t border-stone-100 p-5" : "hidden"}>
        <div className="space-y-4">
          {steps.map((step, index) => <div key={index} data-step-index={index} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropStep(event, index)} className={`rounded-2xl bg-stone-50 p-4 transition ${touchTargetIndex === index ? "ring-2 ring-stone-400" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <span onPointerDown={(event) => beginTouchDrag(event, index)} onPointerMove={continueTouchDrag} onPointerUp={endTouchDrag} onPointerCancel={endTouchDrag} className="cursor-grab select-none touch-none text-sm font-semibold text-stone-500">☰ Step {index + 1}</span>
              <div className="flex gap-2"><button type="button" onClick={() => moveStep(index, index - 1)} disabled={index === 0} className="min-h-9 min-w-10 rounded-lg border bg-white disabled:opacity-30">↑</button><button type="button" onClick={() => moveStep(index, index + 1)} disabled={index === steps.length - 1} className="min-h-9 min-w-10 rounded-lg border bg-white disabled:opacity-30">↓</button><button type="button" onClick={() => deleteStep(index)} className="flex h-9 w-9 items-center justify-center rounded-full border bg-white">−</button></div>
            </div>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Step<select name="step_type" defaultValue={step.step_type} className="mt-2 min-h-12 w-full rounded-xl border bg-white px-3"><option value="mixing">Mixing</option><option value="kneading">Kneading</option><option value="proofing">Proofing</option><option value="shaping">Shaping</option><option value="resting">Resting</option><option value="other">Other</option></select></label><label className="text-sm font-medium">Minutes<input name="step_duration" type="number" min="0" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label></div>
            <label className="mt-3 block text-sm font-medium">What did you do?<input name="step_description" defaultValue={step.description ?? ""} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label>
            <label className="mt-3 block text-sm font-medium">Temperature °F <span className="font-normal text-stone-400">(when useful)</span><input name="step_temperature" type="number" step="0.1" defaultValue={step.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label>
          </div>)}
        </div>
        <button type="button" onClick={addStep} className="mt-4 min-h-12 w-full rounded-xl border border-dashed px-4 font-semibold">+ Add another process step</button>
        <button type="button" onClick={() => setOpenSection("baking")} className="mt-4 min-h-12 w-full rounded-xl bg-stone-900 px-4 font-semibold text-white">Move on to Baking →</button>
      </div>
    </section>

    <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
      {sectionHeader("Baking", openSection === "baking" ? "Record each oven stage." : `${baking.length} baking stages`, "baking")}
      <div className={openSection === "baking" ? "border-t border-stone-100 p-5" : "hidden"}>
        <div className="space-y-4">{baking.map((stage, index) => <div key={index} className="rounded-2xl bg-stone-50 p-4"><div className="flex justify-end"><button type="button" onClick={() => deleteBakingStage(index)} className="flex h-9 w-9 items-center justify-center rounded-full border bg-white">−</button></div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Oven °F<input name="bake_temperature" type="number" defaultValue={stage.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label><label className="text-sm font-medium">Minutes<input name="bake_duration" type="number" defaultValue={stage.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label></div><div className="mt-3 grid grid-cols-[9rem_1fr] gap-3"><label className="text-sm font-medium">Lid<select name="bake_lid" defaultValue={stage.lid_on ? "on" : "off"} className="mt-2 min-h-12 w-full rounded-xl border bg-white px-3"><option value="on">On</option><option value="off">Off</option></select></label><label className="text-sm font-medium">Note<input name="bake_description" defaultValue={stage.description ?? ""} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label></div></div>)}</div>
        <button type="button" onClick={addBakingStage} className="mt-4 min-h-12 w-full rounded-xl border border-dashed font-semibold">+ Add baking stage</button>
        <button type="button" onClick={() => setOpenSection("cooling")} className="mt-4 min-h-12 w-full rounded-xl bg-stone-900 font-semibold text-white">Move on to Cooling →</button>
      </div>
    </section>

    <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
      {sectionHeader("Cooling", openSection === "cooling" ? "Record cooling after the loaf leaves the oven." : "Cooling details", "cooling")}
      <div className={openSection === "cooling" ? "border-t border-stone-100 p-5" : "hidden"}>
        <div className="space-y-4">{cooling.map((step) => <div key={step.description} className="rounded-2xl bg-stone-50 p-4"><input type="hidden" name="cooling_name" value={step.description ?? ""} /><h3 className="font-semibold">{step.description}</h3><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-medium">Minutes<input name="cooling_duration" type="number" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label><label className="text-sm font-medium">Temperature °F<input name="cooling_temperature" type="number" defaultValue={step.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border px-3" /></label></div></div>)}</div>
        <p className="mt-4 text-sm text-stone-500">When you're ready to evaluate the loaf, scroll to Evaluation below. Process and Baking stay collapsed unless you reopen them.</p>
      </div>
    </section>
  </form>;
}
