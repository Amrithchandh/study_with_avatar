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

/**
  Renders the chosen photo/video avatar directly in a clean, prominent portrait frame.
  The cartoon SVG body has been removed as requested, placing full focus on the chosen teacher photo/video.
 */
export default function AvatarTeacher({ faceVideoUrl, photoDataUrl, gesture, isSpeaking, currentWord }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (faceVideoUrl && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [faceVideoUrl]);

  return (
    <div className="relative w-full max-w-sm h-80 mx-auto flex flex-col items-center justify-center select-none">
      {/* Clean Portrait Avatar Frame */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-4 border-indigo-500/80 shadow-2xl bg-slate-950 ring-4 ring-indigo-500/20 transition-all duration-300">
        {faceVideoUrl ? (
          <video
            ref={videoRef}
            src={faceVideoUrl}
            className="w-full h-full object-cover"
            playsInline
            muted={false}
            autoPlay
          />
        ) : photoDataUrl ? (
          <LivingPhotoCanvas photoDataUrl={photoDataUrl} isSpeaking={isSpeaking} currentWord={currentWord} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
            <span className="text-3xl mb-2">📷</span>
            <span className="text-xs font-medium">No Photo Selected</span>
          </div>
        )}

        {/* Live Speaking Badge */}
        {isSpeaking && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white text-xs px-3.5 py-1 rounded-full shadow-lg backdrop-blur flex items-center gap-2 border border-indigo-400/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Teaching Class Live</span>
          </div>
        )}
      </div>

      {/* Gesture Badge Indicator */}
      {gesture && gesture !== "idle" && (
        <div className="mt-3 text-xs text-indigo-300 font-mono bg-indigo-950/60 px-3 py-1 rounded-md border border-indigo-800/40">
          Gesture: {gesture.replace("_", " ")}
        </div>
      )}
    </div>
  );
}

function LivingPhotoCanvas({ photoDataUrl, isSpeaking, currentWord }: { photoDataUrl: string; isSpeaking: boolean; currentWord?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rig, setRig] = useState<FaceLandmarkRig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
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
    img.crossOrigin = "anonymous";
    img.src = photoDataUrl;

    let rafId: number;
    let frameCount = 0;

    img.onload = () => {
      canvas.width = img.naturalWidth || 400;
      canvas.height = img.naturalHeight || 400;

      const render = () => {
        frameCount++;
        let mouthOpen = 0;

        if (isSpeaking) {
          if (currentWord) {
            mouthOpen = estimateMouthOpenFromWord(currentWord);
          } else {
            mouthOpen = 0.25 + 0.45 * Math.abs(Math.sin(frameCount * 0.25));
          }
        }

        const isBlinking = frameCount % 130 > 122;

        if (rig) {
          drawTalkingFrame(ctx, img, rig, mouthOpen, isBlinking);
        } else {
          // Dynamic lip-sync canvas warp on lower mouth region of chosen photo
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          if (mouthOpen > 0.05) {
            const mouthY = h * 0.58;
            const mouthH = h * 0.28;
            const scaleY = 1 + mouthOpen * 0.35;
            ctx.save();
            ctx.translate(w / 2, mouthY + mouthH / 2);
            ctx.scale(1, scaleY);
            ctx.translate(-w / 2, -(mouthY + mouthH / 2));
            ctx.drawImage(img, 0, mouthY, w, mouthH, 0, mouthY, w, mouthH);
            ctx.restore();
          }

          if (isBlinking) {
            const eyeY = h * 0.35;
            const eyeH = h * 0.08;
            ctx.fillStyle = "rgba(40, 30, 20, 0.4)";
            ctx.fillRect(w * 0.2, eyeY, w * 0.6, eyeH);
          }
        }

        rafId = requestAnimationFrame(render);
      };

      render();
    };

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [photoDataUrl, isSpeaking, currentWord, rig]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
}
