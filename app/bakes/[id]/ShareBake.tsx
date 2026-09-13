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

function drawRoundedCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  drawCover(ctx, image, x, y, width, height);
  ctx.restore();
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

    const margin = 64;
    const contentWidth = canvas.width - margin * 2;

    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Hero image: deliberately inset from every edge so Instagram cannot make
    // the card feel clipped even when it previews the post tightly.
    const heroImage = await loadImage(hero.signed_url);
    const heroY = 64;
    const heroHeight = 470;
    drawRoundedCover(ctx, heroImage, margin, heroY, contentWidth, heroHeight, 28);

    // Dark title band lives completely inside the hero image.
    const bandY = heroY + heroHeight - 170;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, heroY, contentWidth, heroHeight, 28);
    ctx.clip();
    ctx.fillStyle = "rgba(20, 18, 16, 0.66)";
    ctx.fillRect(margin, bandY, contentWidth, 170);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px system-ui, -apple-system, sans-serif";
    const titleLines = wrapText(ctx, bakeName, 760).slice(0, 2);
    const titleStartY = titleLines.length > 1 ? bandY + 66 : bandY + 82;
    titleLines.forEach((line, index) => ctx.fillText(line, margin + 34, titleStartY + index * 56));

    const metaParts = [
      experimentName,
      new Date(`${bakeDate}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    ].filter(Boolean);
    ctx.font = "400 25px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(metaParts.join("  ·  "), margin + 36, bandY + 145);

    // Recap heading and divider.
    const recapTop = 604;
    ctx.fillStyle = "#1c1917";
    ctx.font = "700 34px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAKE RECAP", margin, recapTop);
    ctx.strokeStyle = "#d6d0c6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin + 220, recapTop - 10);
    ctx.lineTo(canvas.width - margin, recapTop - 10);
    ctx.stroke();

    const leftX = margin;
    const rightX = 558;
    const columnWidth = 458;
    const fieldTop = 666;

    function drawField(label: string, value: string, x: number, y: number, maxLines = 2) {
      if (!value) return y;
      ctx.fillStyle = "#78716c";
      ctx.font = "700 18px system-ui, -apple-system, sans-serif";
      ctx.fillText(label.toUpperCase(), x, y);

      ctx.fillStyle = "#292524";
      ctx.font = "500 27px system-ui, -apple-system, sans-serif";
      const lines = wrapText(ctx, value, columnWidth).slice(0, maxLines);
      lines.forEach((line, index) => ctx.fillText(line, x, y + 38 + index * 34));
      return y + 38 + lines.length * 34 + 30;
    }

    let leftY = fieldTop;
    leftY = drawField("Hydration", `${hydration.toFixed(1)}%`, leftX, leftY, 1);
    leftY = drawField("Flour", flourSummary, leftX, leftY, 2);
    drawField("Process", processSummary, leftX, leftY, 2);

    let rightY = fieldTop;
    rightY = drawField("Bake", bakingSummary, rightX, rightY, 2);
    rightY = drawField("Result", evaluationSummary, rightX, rightY, 2);
    drawField("Notes", notes || "—", rightX, rightY, 2);

    // Optional supporting photos sit in a horizontal strip instead of forming
    // a tall column. This keeps the composition inside Instagram's safe area.
    const extraPhotos = selectedExtras
      .map((id) => photos.find((photo) => photo.id === id))
      .filter(Boolean) as SharePhoto[];

    const stripY = 1058;
    const stripHeight = 170;
    if (extraPhotos.length) {
      const gap = 20;
      const photoWidth = extraPhotos.length === 1 ? 460 : (contentWidth - gap) / 2;
      for (let index = 0; index < extraPhotos.length; index++) {
        const image = await loadImage(extraPhotos[index].signed_url);
        const x = extraPhotos.length === 1
          ? margin + (contentWidth - photoWidth) / 2
          : margin + index * (photoWidth + gap);
        drawRoundedCover(ctx, image, x, stripY, photoWidth, stripHeight, 20);
      }
    } else {
      ctx.fillStyle = "#ebe5dc";
      ctx.beginPath();
      ctx.roundRect(margin, stripY, contentWidth, stripHeight, 20);
      ctx.fill();
      ctx.fillStyle = "#57534e";
      ctx.font = "600 26px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BAKE · LEARN · IMPROVE · REPEAT", canvas.width / 2, stripY + 95);
      ctx.textAlign = "left";
    }

    // Footer remains well above the bottom crop zone.
    ctx.fillStyle = "#78716c";
    ctx.font = "600 20px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BREAD BAKING LOG", canvas.width / 2, 1282);
    ctx.font = "400 18px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a8a29e";
    ctx.fillText("bread-baking-log.netlify.app", canvas.width / 2, 1314);
    ctx.textAlign = "left";

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export the share card.")), "image/jpeg", 0.94);
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
      <p className="mt-1 text-sm leading-6 text-stone-500">Build a 4:5 Instagram card with generous safe margins, a compact recap, and up to two extra photos.</p>

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
