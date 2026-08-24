"use client";

import { useMemo, useState } from "react";

type SharePhoto = {
  id: string;
  signed_url: string;
  caption: string | null;
  is_thumbnail: boolean;
};

type Props = {
  bakeName: string;
  experimentName: string | null;
  bakeDate: string;
  hydration: number;
  flourSummary: string;
  processSummary: string;
  bakingSummary: string;
  evaluationSummary: string;
  notes: string | null;
  photos: SharePhoto[];
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function loadImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load a photo for the share card.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not decode a photo for the share card."));
      image.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sx = (image.width - sourceWidth) / 2;
  const sy = (image.height - sourceHeight) / 2;
  ctx.drawImage(image, sx, sy, sourceWidth, sourceHeight, x, y, width, height);
}

export default function ShareBake({ bakeName, experimentName, bakeDate, hydration, flourSummary, processSummary, bakingSummary, evaluationSummary, notes, photos }: Props) {
  const hero = photos.find((photo) => photo.is_thumbnail) ?? photos[0] ?? null;
  const otherPhotos = photos.filter((photo) => photo.id !== hero?.id);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const generatedCaption = useMemo(() => {
    const lines = [
      experimentName ? `${bakeName} — ${experimentName}` : bakeName,
      "",
      `${hydration.toFixed(1)}% hydration · ${flourSummary}`,
    ];
    if (processSummary) lines.push(`Process: ${processSummary}`);
    if (bakingSummary) lines.push(`Bake: ${bakingSummary}`);
    if (evaluationSummary) lines.push(`Result: ${evaluationSummary}`);
    if (notes) lines.push(`Notes: ${notes}`);
    lines.push("", "Logged with Bread Baking Log.", "#breadbaking #homebaking #breadexperiment");
    return lines.join("\n");
  }, [bakeName, experimentName, hydration, flourSummary, processSummary, bakingSummary, evaluationSummary, notes]);

  const [caption, setCaption] = useState(generatedCaption);

  function toggleExtra(photoId: string) {
    setSelectedExtras((current) => {
      if (current.includes(photoId)) return current.filter((id) => id !== photoId);
      if (current.length >= 2) return current;
      return [...current, photoId];
    });
  }

  async function createCardBlob() {
    if (!hero) throw new Error("Choose a home thumbnail before creating an Instagram card.");
    setStatus("Building card…");
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not create the share card.");

    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const heroImage = await loadImage(hero.signed_url);
    drawCover(ctx, heroImage, 0, 0, 1080, 650);

    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 500, 1080, 150);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 58px system-ui, -apple-system, sans-serif";
    const titleLines = wrapText(ctx, bakeName, 900).slice(0, 2);
    titleLines.forEach((line, index) => ctx.fillText(line, 64, 555 + index * 62));
    if (experimentName) {
      ctx.font = "400 30px system-ui, -apple-system, sans-serif";
      ctx.fillText(experimentName, 66, 625);
    }

    ctx.fillStyle = "#1c1917";
    ctx.font = "700 38px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAKE RECAP", 64, 730);
    ctx.font = "400 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#78716c";
    ctx.fillText(new Date(`${bakeDate}T12:00:00`).toLocaleDateString(), 64, 770);

    const extraPhotos = selectedExtras.map((id) => photos.find((photo) => photo.id === id)).filter(Boolean) as SharePhoto[];
    const textWidth = extraPhotos.length ? 610 : 940;
    let y = 830;

    const recapLines = [
      `${hydration.toFixed(1)}% hydration · ${flourSummary}`,
      processSummary ? `Process: ${processSummary}` : "",
      bakingSummary ? `Bake: ${bakingSummary}` : "",
      evaluationSummary ? `Result: ${evaluationSummary}` : "",
    ].filter(Boolean);

    ctx.fillStyle = "#292524";
    ctx.font = "500 29px system-ui, -apple-system, sans-serif";
    for (const item of recapLines) {
      const lines = wrapText(ctx, item, textWidth).slice(0, 2);
      for (const line of lines) {
        ctx.fillText(line, 64, y);
        y += 42;
      }
      y += 10;
    }

    if (notes && y < 1160) {
      ctx.fillStyle = "#57534e";
      ctx.font = "400 25px system-ui, -apple-system, sans-serif";
      const lines = wrapText(ctx, `Notes: ${notes}`, textWidth).slice(0, 3);
      for (const line of lines) {
        ctx.fillText(line, 64, y);
        y += 36;
      }
    }

    if (extraPhotos.length) {
      const x = 720;
      const size = 290;
      for (let index = 0; index < extraPhotos.length; index++) {
        const image = await loadImage(extraPhotos[index].signed_url);
        const photoY = 760 + index * 315;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, photoY, size, size, 24);
        ctx.clip();
        drawCover(ctx, image, x, photoY, size, size);
        ctx.restore();
      }
    }

    ctx.fillStyle = "#a8a29e";
    ctx.font = "500 22px system-ui, -apple-system, sans-serif";
    ctx.fillText("BREAD BAKING LOG · bread-baking-log.netlify.app", 64, 1300);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export the share card.")), "image/jpeg", 0.92);
    });
  }

  async function downloadCard() {
    try {
      const blob = await createCardBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bakeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bread-bake"}-instagram.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Card saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not build card.");
    }
  }

  async function shareCard() {
    try {
      const blob = await createCardBlob();
      const file = new File([blob], "bread-bake-instagram.jpg", { type: "image/jpeg" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: bakeName, text: caption, files: [file] });
        setStatus("Share sheet opened.");
      } else {
        setStatus("Direct sharing is not available in this browser. Use Save card instead.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") { setStatus(""); return; }
      setStatus(error instanceof Error ? error.message : "Could not share card.");
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setStatus("Caption copied.");
    } catch {
      setStatus("Could not copy automatically. Select the caption text and copy it manually.");
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Share this bake</h2>
      <p className="mt-1 text-sm leading-6 text-stone-500">Build a 4:5 Instagram card from your chosen thumbnail, recap, and up to two extra photos.</p>

      {!hero ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Add a photo and choose a home thumbnail first.</p> : (
        <>
          <div className="mt-4 grid grid-cols-[6rem_1fr] gap-4 rounded-2xl bg-stone-50 p-3">
            <img src={hero.signed_url} alt={hero.caption || "Selected bread thumbnail"} className="h-24 w-24 rounded-xl object-cover" />
            <div className="self-center"><div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Main image</div><div className="mt-1 text-sm font-semibold text-stone-800">Home thumbnail</div><div className="mt-1 text-xs text-stone-500">This stays the hero image on the Instagram card.</div></div>
          </div>

          {otherPhotos.length ? <div className="mt-5"><div className="flex items-baseline justify-between"><h3 className="text-sm font-semibold text-stone-800">Add up to 2 more photos</h3><span className="text-xs text-stone-400">{selectedExtras.length}/2 selected</span></div><div className="mt-3 grid grid-cols-3 gap-3">{otherPhotos.map((photo) => {
            const selected = selectedExtras.includes(photo.id);
            return <button key={photo.id} type="button" onClick={() => toggleExtra(photo.id)} className={`relative overflow-hidden rounded-xl border-2 ${selected ? "border-stone-900" : "border-transparent"}`} aria-pressed={selected}><img src={photo.signed_url} alt={photo.caption || "Bread bake photo"} className="aspect-square w-full object-cover" />{selected ? <span className="absolute right-1.5 top-1.5 rounded-full bg-stone-900 px-2 py-1 text-[10px] font-semibold text-white">✓</span> : null}</button>;
          })}</div></div> : null}

          <label className="mt-5 block text-sm font-semibold text-stone-800">Instagram caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm font-normal leading-6" /></label>

          <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={shareCard} className="min-h-12 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white">Share card</button><button type="button" onClick={downloadCard} className="min-h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700">Save card</button></div>
          <button type="button" onClick={copyCaption} className="mt-3 min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 text-sm font-semibold text-stone-700">Copy caption</button>
          <p className="mt-2 text-xs leading-5 text-stone-400">On mobile, Share card opens the phone share sheet when supported. Instagram may still require you to paste the prepared caption separately.</p>
          {status ? <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600" aria-live="polite">{status}</p> : null}
        </>
      )}
    </section>
  );
}
