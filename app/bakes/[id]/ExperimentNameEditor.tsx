"use client";

import { useEffect, useRef, useState } from "react";
import { saveExperimentName } from "./experiment-actions";

export default function ExperimentNameEditor({ bakeId, initialValue }: { bakeId: string; initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? "");
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function scheduleSave(nextValue: string) {
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const result = await saveExperimentName(bakeId, nextValue);
      setStatus(result.ok ? "saved" : "error");
    }, 700);
  }

  return (
    <div className="mt-2">
      <input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          scheduleSave(event.target.value);
        }}
        placeholder="Experiment / variation, e.g. 50% whole wheat"
        className="min-h-10 w-full max-w-sm rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700"
      />
      <div className="mt-1 text-xs text-stone-400">
        {status === "pending" ? "Changes pending…" : status === "saving" ? "Saving…" : status === "error" ? "Not saved" : "✓ Saved"}
      </div>
    </div>
  );
}
