"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  signed_url: string;
};

type Status = "idle" | "uploading" | "saving" | "deleting" | "error" | "saved";

export default function PhotosSection({ bakeId, userId, initialPhotos }: { bakeId: string; userId: string; initialPhotos: Photo[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function refreshSignedUrl(storagePath: string) {
    const { data, error } = await supabase.storage.from("bake-photos").createSignedUrl(storagePath, 60 * 60);
    if (error || !data?.signedUrl) throw error ?? new Error("Could not create photo URL.");
    return data.signedUrl;
  }

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setMessage("Photo must be 10 MB or smaller.");
      return;
    }

    setStatus("uploading");
    setMessage("");
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const storagePath = `${userId}/${bakeId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("bake-photos").upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) {
      setStatus("error");
      setMessage(uploadError.message);
      return;
    }

    const { data: row, error: insertError } = await supabase
      .from("bake_photos")
      .insert({ bake_id: bakeId, user_id: userId, storage_path: storagePath })
      .select("id, storage_path, caption")
      .single();

    if (insertError || !row) {
      await supabase.storage.from("bake-photos").remove([storagePath]);
      setStatus("error");
      setMessage(insertError?.message ?? "Could not save photo record.");
      return;
    }

    try {
      const signedUrl = await refreshSignedUrl(storagePath);
      setPhotos((current) => [{ ...row, signed_url: signedUrl }, ...current]);
      setStatus("saved");
      setMessage("Photo added.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Photo uploaded, but preview failed.");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) await uploadPhoto(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function updateCaption(photoId: string, caption: string) {
    setPhotos((current) => current.map((photo) => photo.id === photoId ? { ...photo, caption } : photo));
    setStatus("saving");
    const { error } = await supabase.from("bake_photos").update({ caption: caption.trim() || null }).eq("id", photoId);
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("saved");
      setMessage("Caption saved.");
    }
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm("Delete this photo?")) return;
    setStatus("deleting");
    setMessage("");

    const { error: storageError } = await supabase.storage.from("bake-photos").remove([photo.storage_path]);
    if (storageError) {
      setStatus("error");
      setMessage(storageError.message);
      return;
    }

    const { error: rowError } = await supabase.from("bake_photos").delete().eq("id", photo.id);
    if (rowError) {
      setStatus("error");
      setMessage(rowError.message);
      return;
    }

    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    setStatus("saved");
    setMessage("Photo deleted.");
  }

  return (
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Photos</h2>
          <p className="mt-1 text-sm text-stone-500">Add loaf, crumb, or process photos.</p>
        </div>
        <span className="text-xs font-semibold text-stone-500" aria-live="polite">
          {status === "uploading" ? "Uploading…" : status === "saving" ? "Saving…" : status === "deleting" ? "Deleting…" : status === "error" ? "Error" : status === "saved" ? "✓ Saved" : ""}
        </span>
      </div>

      {message ? <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-stone-50 text-stone-600"}`}>{message}</p> : null}

      <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-400 bg-stone-50 px-4 py-3 font-semibold text-stone-700">
        + Add photo
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} className="sr-only" />
      </label>
      <p className="mt-2 text-xs text-stone-400">On a phone, this should offer the camera or photo library. Up to 10 MB per image.</p>

      {photos.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              <img src={photo.signed_url} alt={photo.caption || "Bread bake photo"} className="aspect-square w-full object-cover" />
              <div className="p-3">
                <input
                  defaultValue={photo.caption ?? ""}
                  placeholder="Caption"
                  onBlur={(event) => updateCaption(photo.id, event.target.value)}
                  className="min-h-10 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm"
                />
                <button type="button" onClick={() => deletePhoto(photo)} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-600">Delete photo</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-stone-400">No photos yet.</p>
      )}
    </section>
  );
}
