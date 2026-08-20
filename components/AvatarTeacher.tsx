"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Gesture } from "../types";
import { buildFaceRig, drawTalkingFrame, estimateMouthOpenFromWord, type FaceLandmarkRig } from "../lib/lipSyncFallback";

interface Props {
  faceVideoUrl?: string;
  photoDataUrl?: string;
  gesture: Gesture;
  isSpeaking: boolean;
  currentWord?: string;
}

export default function AvatarTeacher({ faceVideoUrl, photoDataUrl, gesture, isSpeaking, currentWord }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (faceVideoUrl && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [faceVideoUrl]);

  return (
    <div className="relative w-80 h-[420px] mx-auto flex flex-col items-center justify-end select-none">
      {/* SVG Body Layer */}
      <svg viewBox="0 0 200 260" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xl">
        <defs>
          <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
        </defs>

        {/* Torso & collar */}
        <path d="M55 160 Q100 135 145 160 L155 260 L45 260 Z" fill="url(#shirt)" />
        <path d="M85 150 L100 170 L115 150 Z" fill="#e0e7ff" />

        {/* Left arm */}
        <g style={armTransform("left", gesture)} className="transition-transform duration-500 ease-out">
          <path d="M58 165 Q25 180 20 220" stroke="#4338ca" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="20" cy="222" r="10" fill="#e8b48c" />
        </g>

        {/* Right arm */}
        <g style={armTransform("right", gesture)} className="transition-transform duration-500 ease-out">
          <path d="M142 165 Q175 180 180 220" stroke="#4338ca" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="180" cy="222" r="10" fill="#e8b48c" />
        </g>
      </svg>

      {/* Face Circle Layer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl bg-slate-800 ring-4 ring-indigo-500/20">
        {faceVideoUrl ? (
          <video ref={videoRef} src={faceVideoUrl} className="w-full h-full object-cover" playsInline muted={false} />
        ) : photoDataUrl ? (
          <LivingPhotoCanvas photoDataUrl={photoDataUrl} isSpeaking={isSpeaking} currentWord={currentWord} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
            <span>No Photo</span>
          </div>
        )}
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Speaking...
        </div>
      )}
    </div>
  );
}

function armTransform(side: "left" | "right", gesture: Gesture): React.CSSProperties {
  const active =
    (gesture === "point_left" && side === "left") ||
    (gesture === "point_right" && side === "right") ||
    gesture === "open_palms";

  if (!active) {
    return { transform: "rotate(0deg)", transformOrigin: side === "left" ? "58px 165px" : "142px 165px" };
  }

  const angle = gesture === "open_palms" ? (side === "left" ? -25 : 25) : side === "left" ? -55 : 55;
  return {
    transform: `rotate(${angle}deg)`,
    transformOrigin: side === "left" ? "58px 165px" : "142px 165px",
  };
}

function LivingPhotoCanvas({ photoDataUrl, isSpeaking, currentWord }: { photoDataUrl: string; isSpeaking: boolean; currentWord?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rig, setRig] = useState<FaceLandmarkRig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = photoDataUrl;
    img.onload = async () => {
      if (cancelled) return;
      const detectedRig = await buildFaceRig(img);
      if (!cancelled && detectedRig) {
        setRig(detectedRig);
      }
    };
    return () => { cancelled = true; };
  }, [photoDataUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = photoDataUrl;

    let rafId: number;
    let frameCount = 0;

    img.onload = () => {
      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;

      const render = () => {
        frameCount++;
        let mouthOpen = 0;

        if (isSpeaking) {
          if (currentWord) {
            mouthOpen = estimateMouthOpenFromWord(currentWord);
          } else {
            // Oscillate mouth height for simulated speech if word stream is unavailable
            mouthOpen = 0.2 + 0.4 * Math.abs(Math.sin(frameCount * 0.2));
          }
        }

        const isBlinking = frameCount % 120 > 112; // blink every ~2 seconds

        if (rig) {
          drawTalkingFrame(ctx, img, rig, mouthOpen, isBlinking);
        } else {
          // Fallback simple draw if landmark rig is unavailable
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        rafId = requestAnimationFrame(render);
      };

      render();
    };

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [photoDataUrl, isSpeaking, currentWord, rig]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover rounded-full" />;
}
