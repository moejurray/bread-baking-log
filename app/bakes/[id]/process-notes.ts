export type CompiledNote = { label: string; text: string };
export type ProcessNotes = { process: CompiledNote[]; baking: CompiledNote[] };

// Fired by ProcessForm whenever step or baking notes change, so the Evaluation section can show them live.
export const PROCESS_NOTES_EVENT = "bake:process-notes";

export function cleanBakingNote(description: string | null) { return (description ?? "").replace(/^\[\[method:(freeform|other)\]\]/, ""); }

function stepLabel(stepType: string) { return stepType.charAt(0).toUpperCase() + stepType.slice(1); }

export function compileProcessNotes(steps: { step_type: string; note: string | null }[], bakingNotes: (string | null)[]): ProcessNotes {
  return {
    process: steps.map((step, index) => ({ label: `Step ${index + 1} · ${stepLabel(step.step_type)}`, text: step.note?.trim() ?? "" })).filter((note) => note.text),
    baking: bakingNotes.map((note, index) => ({ label: `Baking Stage ${index + 1}`, text: note?.trim() ?? "" })).filter((note) => note.text),
  };
}
