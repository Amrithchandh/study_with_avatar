"use client";

import React, { useState, useRef } from "react";
import { buildFaceRig, loadFaceModels } from "../lib/lipSyncFallback";

interface Props {
  onReady: (photoDataUrl: string, provider: "d-id" | "faceMeshFallback") => void;
}

export default function PhotoAvatarSetup({ onReady }: Props) {
  const [status, setStatus] = useState<"idle" | "validating" | "error" | "ready">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [provider, setProvider] = useState<"d-id" | "faceMeshFallback">("faceMeshFallback");
  const imgRef = useRef<HTMLImageElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("validating");
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);

    try {
      await loadFaceModels();
      const img = new Image();
      img.src = dataUrl;
      await img.decode();

      const rig = await buildFaceRig(img);
      if (!rig) {
        // Even if automatic face detection doesn't pinpoint exact landmarks, allow user to proceed with fallback rig
        console.warn("Face landmarks not detected with high confidence; using photo with fallback rig.");
      }
      setStatus("ready");
      onReady(dataUrl, provider);
    } catch {
      // In case of model load failure, proceed with preview
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

  function useDefaultTeacherPhoto() {
    // Generate a clean default SVG avatar data URI for instant testing
    const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect width="300" height="300" fill="#1e293b"/>
      <circle cx="150" cy="110" r="55" fill="#f87171"/>
      <circle cx="130" cy="100" r="8" fill="#ffffff"/>
      <circle cx="170" cy="100" r="8" fill="#ffffff"/>
      <circle cx="130" cy="100" r="4" fill="#000000"/>
      <circle cx="170" cy="100" r="4" fill="#000000"/>
      <path d="M125 135 Q150 155 175 135" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M70 260 Q150 190 230 260 Z" fill="#3b82f6"/>
    </svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(defaultSvg)}`;
    setPreview(dataUrl);
    setStatus("ready");
    onReady(dataUrl, provider);
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-6 space-y-5 shadow-xl max-w-lg mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-white">Choose Avatar Teacher Photo</h3>
        <p className="text-xs text-slate-400 mt-1">Upload your own photo or pick quality mode.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">Avatar Engine</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setProvider("faceMeshFallback")}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              provider === "faceMeshFallback"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
            }`}
          >
            ⚡ Free Living Photo (Browser)
          </button>
          <button
            type="button"
            onClick={() => setProvider("d-id")}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              provider === "d-id"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
            }`}
          >
            🎬 Realistic D-ID API (Paid)
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block">Upload Photo</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
        />
        
        <button
          type="button"
          onClick={useDefaultTeacherPhoto}
          className="text-xs text-indigo-400 hover:text-indigo-300 underline block"
        >
          Or click here to use Default Avatar Photo
        </button>
      </div>

      {preview && (
        <div className="flex items-center gap-4 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={preview} alt="preview" className="w-16 h-16 object-cover rounded-full border-2 border-indigo-500" />
          <div>
            <p className="text-xs font-medium text-white">Avatar Photo Selected</p>
            <p className="text-[11px] text-slate-400">{provider === "d-id" ? "D-ID Video Mode" : "Free Canvas Animation Mode"}</p>
          </div>
        </div>
      )}

      {status === "validating" && <p className="text-xs text-amber-400 animate-pulse">Checking photo for face landmarks...</p>}
      {status === "error" && <p className="text-xs text-red-400">No clear face detected — try a front-facing photo.</p>}
      {status === "ready" && <p className="text-xs text-emerald-400">✓ Avatar profile configured!</p>}
    </div>
  );
}
