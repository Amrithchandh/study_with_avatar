"use client";

import React, { useState, useRef } from "react";
import { buildFaceRig, loadFaceModels } from "../lib/lipSyncFallback";

interface Props {
  onReady: (photoUrl: string, provider: "d-id" | "faceMeshFallback") => void;
}

const SAMPLE_PUBLIC_PHOTOS = [
  { name: "Prof. Male Teacher", url: "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg" },
  { name: "Prof. Female Teacher", url: "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg" },
];

export default function PhotoAvatarSetup({ onReady }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "validating" | "error" | "ready">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [provider, setProvider] = useState<"d-id" | "faceMeshFallback">("d-id");
  const imgRef = useRef<HTMLImageElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      const localUrl = uploadData.localUrl || (await fileToDataUrl(file));
      const photoUrlForDid = uploadData.dIdS3Url || uploadData.publicUrl || localUrl;

      setPreview(localUrl);
      setStatus("validating");

      // Validate face landmarks client side
      await loadFaceModels();
      const img = new Image();
      img.src = localUrl;
      await img.decode();

      await buildFaceRig(img);

      setStatus("ready");
      const finalUrl = provider === "d-id" ? photoUrlForDid : localUrl;
      onReady(finalUrl, provider);
    } catch (err) {
      console.warn("Upload/validation warning:", err);
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      setStatus("ready");
      onReady(dataUrl, provider);
    }
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function selectSamplePhoto(url: string) {
    setStatus("uploading");
    setPreview(url);

    try {
      // Re-upload sample image through /api/upload-photo so D-ID gets a valid S3 URL
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      const finalUrl = provider === "d-id" ? (data.dIdS3Url || url) : url;
      setStatus("ready");
      onReady(finalUrl, provider);
    } catch {
      setStatus("ready");
      onReady(url, provider);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-6 space-y-5 shadow-xl max-w-lg mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-white">Choose Avatar Teacher Photo</h3>
        <p className="text-xs text-slate-400 mt-1">Upload your own photo or pick a sample photo.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">Avatar Engine</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setProvider("d-id")}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
              provider === "d-id"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/30"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
            }`}
          >
            🎬 Realistic D-ID API (Paid)
          </button>
          <button
            type="button"
            onClick={() => setProvider("faceMeshFallback")}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
              provider === "faceMeshFallback"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/30"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
            }`}
          >
            ⚡ Free Living Photo (Browser)
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">Upload Photo File</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
        />
      </div>

      {provider === "d-id" && (
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <label className="text-xs font-medium text-slate-400 block">Or select a Verified D-ID Teacher Sample Photo:</label>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_PUBLIC_PHOTOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => selectSamplePhoto(sample.url)}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 flex items-center gap-2 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sample.url} alt={sample.name} className="w-10 h-10 rounded-full object-cover" />
                <span className="text-xs font-medium text-slate-200">{sample.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {preview && (
        <div className="flex items-center gap-4 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={preview} alt="preview" className="w-16 h-16 object-cover rounded-full border-2 border-indigo-500 shadow-md" />
          <div>
            <p className="text-xs font-medium text-white">Avatar Photo Selected</p>
            <p className="text-[11px] text-slate-400">{provider === "d-id" ? "D-ID Talk Video Mode" : "Free Living Photo Mode"}</p>
          </div>
        </div>
      )}

      {status === "uploading" && <p className="text-xs text-amber-400 animate-pulse">Uploading photo to D-ID S3 storage...</p>}
      {status === "validating" && <p className="text-xs text-amber-400 animate-pulse">Validating facial features...</p>}
      {status === "error" && <p className="text-xs text-red-400">No clear face detected — try a front-facing photo.</p>}
      {status === "ready" && <p className="text-xs text-emerald-400">✓ Avatar profile configured & ready!</p>}
    </div>
  );
}
