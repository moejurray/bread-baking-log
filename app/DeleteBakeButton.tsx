"use client";

import { useFormStatus } from "react-dom";

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export default function DeleteBakeButton({ action, bakeName }: { action: () => void | Promise<void>; bakeName: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${bakeName}”? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
      className="flex-1"
    >
      <DeleteSubmit />
    </form>
  );
}
