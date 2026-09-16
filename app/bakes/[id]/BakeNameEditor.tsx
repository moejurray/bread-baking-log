"use client";

import { useEffect, useRef, useState } from "react";
import { saveBakeName } from "./experiment-actions";

export default function BakeNameEditor({ bakeId, initialValue }: { bakeId: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function scheduleSave(nextValue: string) {
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const result = await saveBakeName(bakeId, nextValue);
      setStatus(result.ok ? "saved" : "error");
    }, 700);
  }

  return (
    <div>
      <input
        autoFocus
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          scheduleSave(event.target.value);
        }}
        aria-label="Bake title"
        className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-2xl font-semibold tracking-tight text-stone-900"
      />
      <div className="mt-1 text-xs text-stone-400">
        {status === "pending" ? "Changes pending…" : status === "saving" ? "Saving…" : status === "error" ? "Not saved" : "✓ Saved"}
      </div>
    </div>
  );
}
