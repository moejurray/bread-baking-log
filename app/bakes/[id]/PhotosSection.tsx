"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  taken_at: string | null;
  is_thumbnail: boolean;
  signed_url: string;
};

type Status = "idle" | "uploading" | "saving" | "deleting" | "error" | "saved";

function photoTime(photo: Photo) {
  return new Date(photo.taken_at ?? photo.created_at).getTime();
}

function sortNewestFirst(items: Photo[]) {
  return [...items].sort((a, b) => photoTime(b) - photoTime(a));
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });
}

async function readTakenAt(file: File): Promise<string | null> {
  try {
    const { parse } = await import("exifr");
    const metadata = await parse(file, ["DateTimeOriginal", "CreateDate", "ModifyDate"]);
    const candidate = metadata?.DateTimeOriginal ?? metadata?.CreateDate ?? metadata?.ModifyDate;
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) return candidate.toISOString();
    if (candidate) {
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
  } catch {
    // Some images have no readable EXIF metadata. Upload time remains the fallback.
  }
  return null;
}

export default function PhotosSection({ bakeId, userId, initialPhotos }: { bakeId: string; userId: string; initialPhotos: Photo[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<Photo[]>(() => sortNewestFirst(initialPhotos));
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedPhoto(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function refreshSignedUrl(storagePath: string) {
    const { data, error } = await supabase.storage.from("bake-photos").createSignedUrl(storagePath, 60 * 60);
    if (error || !data?.signedUrl) throw error ?? new Error("Could not create photo URL.");
    return data.signedUrl;
  }

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) { setStatus("error"); setMessage("Please choose an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setStatus("error"); setMessage("Photo must be 10 MB or smaller."); return; }

    setStatus("uploading"); setMessage("");
    const takenAt = await readTakenAt(file);
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const storagePath = `${userId}/${bakeId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("bake-photos").upload(storagePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) { setStatus("error"); setMessage(uploadError.message); return; }

    const { data: row, error: insertError } = await supabase
      .from("bake_photos")
      .insert({ bake_id: bakeId, user_id: userId, storage_path: storagePath, taken_at: takenAt, is_thumbnail: false })
      .select("id, storage_path, caption, created_at, taken_at, is_thumbnail")
      .single();

    if (insertError || !row) {
      await supabase.storage.from("bake-photos").remove([storagePath]);
      setStatus("error"); setMessage(insertError?.message ?? "Could not save photo record."); return;
    }

    try {
      const signedUrl = await refreshSignedUrl(storagePath);
      setPhotos((current) => sortNewestFirst([{ ...row, signed_url: signedUrl }, ...current]));
      setStatus("saved");
      setMessage(takenAt ? "Photo added with camera timestamp." : "Photo added. No camera timestamp was available, so upload time is used.");
    } catch (error) {
      setStatus("error"); setMessage(error instanceof Error ? error.message : "Photo uploaded, but preview failed.");
    }
  }

  async function handleFiles(files: FileList | null, source: "camera" | "library") {
    if (!files?.length) return;
    for (const file of Array.from(files)) await uploadPhoto(file);
    if (source === "camera" && cameraRef.current) cameraRef.current.value = "";
    if (source === "library" && libraryRef.current) libraryRef.current.value = "";
  }

  async function updateCaption(photoId: string, caption: string) {
    setPhotos((current) => current.map((photo) => photo.id === photoId ? { ...photo, caption } : photo));
    setStatus("saving");
    const { error } = await supabase.from("bake_photos").update({ caption: caption.trim() || null }).eq("id", photoId);
    if (error) { setStatus("error"); setMessage(error.message); } else { setStatus("saved"); setMessage("Caption saved."); }
  }

  async function useAsThumbnail(photoId: string) {
    setStatus("saving"); setMessage("");
    const { error: clearError } = await supabase.from("bake_photos").update({ is_thumbnail: false }).eq("bake_id", bakeId).eq("is_thumbnail", true);
    if (clearError) { setStatus("error"); setMessage(clearError.message); return; }
    const { error: setError } = await supabase.from("bake_photos").update({ is_thumbnail: true }).eq("id", photoId).eq("bake_id", bakeId);
    if (setError) { setStatus("error"); setMessage(setError.message); return; }
    setPhotos((current) => current.map((photo) => ({ ...photo, is_thumbnail: photo.id === photoId })));
    setStatus("saved"); setMessage("Home-page thumbnail updated.");
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm("Delete this photo?")) return;
    setStatus("deleting"); setMessage("");
    const { error: storageError } = await supabase.storage.from("bake-photos").remove([photo.storage_path]);
    if (storageError) { setStatus("error"); setMessage(storageError.message); return; }
    const { error: rowError } = await supabase.from("bake_photos").delete().eq("id", photo.id);
    if (rowError) { setStatus("error"); setMessage(rowError.message); return; }
    if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    setStatus("saved"); setMessage(photo.is_thumbnail ? "Photo deleted. The newest remaining photo will be used until you choose another thumbnail." : "Photo deleted.");
  }

  return (
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold text-stone-900">Photos</h2><p className="mt-1 text-sm text-stone-500">Add loaf, crumb, or process photos.</p></div>
        <span className="text-xs font-semibold text-stone-500" aria-live="polite">{status === "uploading" ? "Uploading…" : status === "saving" ? "Saving…" : status === "deleting" ? "Deleting…" : status === "error" ? "Error" : status === "saved" ? "✓ Saved" : ""}</span>
      </div>

      {message ? <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-stone-50 text-stone-600"}`}>{message}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white">
          Take photo
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(event) => handleFiles(event.target.files, "camera")} className="sr-only" />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700">
          Choose photo
          <input ref={libraryRef} type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files, "library")} className="sr-only" />
        </label>
      </div>
      <p className="mt-2 text-xs text-stone-400">Take photo opens the phone camera when supported. Choose photo opens the photo library. Tap a thumbnail to enlarge it.</p>

      {photos.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo) => {
            const displayTime = photo.taken_at ?? photo.created_at;
            return <div key={photo.id} className={`overflow-hidden rounded-2xl border bg-stone-50 ${photo.is_thumbnail ? "border-stone-800 ring-2 ring-stone-200" : "border-stone-200"}`}>
              <button type="button" onClick={() => setSelectedPhoto(photo)} className="relative block w-full cursor-zoom-in text-left" aria-label="Open larger photo">
                <img src={photo.signed_url} alt={photo.caption || "Bread bake photo"} className="aspect-square w-full object-cover" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white shadow-sm">{formatTimestamp(displayTime)}</span>
                {photo.is_thumbnail ? <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-stone-800 shadow-sm">Thumbnail</span> : null}
              </button>
              <div className="p-3">
                <input defaultValue={photo.caption ?? ""} placeholder="Caption" onBlur={(event) => updateCaption(photo.id, event.target.value)} className="min-h-10 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm" />
                <button type="button" onClick={() => useAsThumbnail(photo.id)} disabled={photo.is_thumbnail} className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold ${photo.is_thumbnail ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}>{photo.is_thumbnail ? "✓ Home thumbnail" : "Use as thumbnail"}</button>
                <button type="button" onClick={() => deletePhoto(photo)} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-600">Delete photo</button>
              </div>
            </div>;
          })}
        </div>
      ) : <p className="mt-5 text-sm text-stone-400">No photos yet.</p>}

      {selectedPhoto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setSelectedPhoto(null)} role="dialog" aria-modal="true" aria-label="Large photo viewer">
          <div className="relative max-h-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-xl text-white" aria-label="Close photo">×</button>
            <img src={selectedPhoto.signed_url} alt={selectedPhoto.caption || "Bread bake photo"} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <div className="mt-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white">
              <div>{formatTimestamp(selectedPhoto.taken_at ?? selectedPhoto.created_at)}</div>
              {selectedPhoto.caption ? <div className="mt-1 text-white/85">{selectedPhoto.caption}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
