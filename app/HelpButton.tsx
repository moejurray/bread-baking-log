"use client";

import { useEffect, useState } from "react";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700"
        aria-label="Help and workflow"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-400 text-xs font-bold">?</span>
        <span className="hidden sm:inline">Help</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Bread Baking Log</p>
                <h2 id="help-title" className="mt-1 text-2xl font-semibold text-stone-900">Help & workflow</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-xl text-stone-500" aria-label="Close help">×</button>
            </div>

            <div className="mt-6 space-y-6 text-sm leading-6 text-stone-700">
              <div>
                <h3 className="font-semibold text-stone-900">Typical bake workflow</h3>
                <ol className="mt-2 space-y-2 pl-5 list-decimal">
                  <li><strong>New Bake:</strong> name the recipe, date it, and enter the formula.</li>
                  <li><strong>Formula:</strong> record flour, water, salt, and yeast. Hydration is calculated automatically.</li>
                  <li><strong>Process:</strong> record mixing, kneading, proofing, shaping, or add your own steps. Reorder steps when needed.</li>
                  <li><strong>Baking:</strong> record each oven stage, temperature, time, and lid on/off.</li>
                  <li><strong>Cooling:</strong> record time in the Dutch oven and on the rack.</li>
                  <li><strong>Evaluation:</strong> score the loaf, use ? for guidance, and add notes to individual criteria with the pencil.</li>
                  <li><strong>Photos:</strong> add loaf, crumb, or process photos and optional captions.</li>
                </ol>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <h3 className="font-semibold text-stone-900">Testing a variation</h3>
                <p className="mt-2"><strong>Clone This</strong> copies the recipe formula and workflow into a new bake dated today. Evaluation and photos are not copied.</p>
                <p className="mt-2">Keep the recipe name stable, then use <strong>Experiment / variation</strong> for the thing you are testing, such as “72% hydration” or “50% whole wheat.”</p>
              </div>

              <div>
                <h3 className="font-semibold text-stone-900">Saving & editing</h3>
                <p className="mt-2">Most changes autosave. Watch for <strong>✓ Saved</strong> before leaving the page. Formula, Process, Baking, Cooling, Evaluation, notes, captions, and experiment names can all be edited later.</p>
              </div>

              <div>
                <h3 className="font-semibold text-stone-900">Deleting a test bake</h3>
                <p className="mt-2">From the Bakes home page, use <strong>Delete</strong> on the bake card. You’ll be asked to confirm before the bake is permanently removed.</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
