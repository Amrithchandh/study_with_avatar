"use client";

import React, { useEffect, useMemo, useState } from "react";
import AvatarTeacher from "./AvatarTeacher";
import Whiteboard from "./Whiteboard";
import type { LessonScript, LessonStep } from "../types";

interface Props {
  script: LessonScript;
  faceVideoUrl?: string;
  photoDataUrl?: string;
  onReset?: () => void;
}

export default function TeachSession({ script, faceVideoUrl, photoDataUrl, onReset }: Props) {
  const [currentStepId, setCurrentStepId] = useState(script.steps[0]?.id ?? 1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [autoPlay, setAutoPlay] = useState(true);

  const currentStep = useMemo(
    () => script.steps.find((s) => s.id === currentStepId) ?? script.steps[0],
    [script.steps, currentStepId]
  );

  const visibleSteps: LessonStep[] = useMemo(() => {
    const idx = script.steps.findIndex((s) => s.id === currentStepId);
    return script.steps.slice(0, idx >= 0 ? idx + 1 : 1);
  }, [script.steps, currentStepId]);

  function speakCurrentStep() {
    if (faceVideoUrl) return;
    if (!currentStep) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentStep.spokenText);
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const word = currentStep.spokenText.substring(event.charIndex, event.charIndex + event.charLength);
        setCurrentWord(word);
      }
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentWord("");
      if (autoPlay) {
        setTimeout(() => {
          goToNextStep();
        }, 1200);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  // Speech synthesis for free fallback mode
  useEffect(() => {
    speakCurrentStep();

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId, faceVideoUrl, autoPlay]);

  // Video timing sync for D-ID path
  useEffect(() => {
    if (!faceVideoUrl) return;
    setIsSpeaking(true);

    const interval = setInterval(() => {
      const video = document.querySelector("video");
      if (!video) return;
      const t = video.currentTime;
      const step = script.steps.find((s) => (s.startTime ?? 0) <= t && t < (s.endTime ?? Infinity));
      if (step && step.id !== currentStepId) {
        setCurrentStepId(step.id);
      }
      if (video.ended) {
        setIsSpeaking(false);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [faceVideoUrl, script.steps, currentStepId]);

  function goToNextStep() {
    const idx = script.steps.findIndex((s) => s.id === currentStepId);
    if (idx >= 0 && idx < script.steps.length - 1) {
      setCurrentStepId(script.steps[idx + 1].id);
    }
  }

  function goToPrevStep() {
    const idx = script.steps.findIndex((s) => s.id === currentStepId);
    if (idx > 0) {
      setCurrentStepId(script.steps[idx - 1].id);
    }
  }

  const isLastStep = script.steps.findIndex((s) => s.id === currentStepId) === script.steps.length - 1;

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📚</span> {script.topic}
          </h1>
          <p className="text-xs text-slate-400">Target Grade: {script.grade} • Live Step {currentStepId} of {script.steps.length}</p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium border border-slate-700"
          >
            ← New Lesson Topic
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Teacher Speech */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 bg-slate-950/80 rounded-xl border border-slate-800 space-y-6">
          <AvatarTeacher
            faceVideoUrl={faceVideoUrl}
            photoDataUrl={photoDataUrl}
            gesture={currentStep?.gesture ?? "idle"}
            isSpeaking={isSpeaking}
            currentWord={currentWord}
          />

          <div className="w-full bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-center shadow-inner relative">
            <p className="text-xs font-mono text-indigo-400 mb-1">Prof. Sharma Speaking Live:</p>
            <p className="text-sm text-slate-200 leading-relaxed font-medium min-h-[60px]">
              &ldquo;{currentStep?.spokenText}&rdquo;
            </p>
            {!faceVideoUrl && (
              <button
                type="button"
                onClick={speakCurrentStep}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                🔊 Re-speak this step
              </button>
            )}
          </div>

          <div className="w-full flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={currentStepId === script.steps[0]?.id}
              className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium border border-slate-700 disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                autoPlay ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {autoPlay ? "Auto-Play: ON" : "Auto-Play: OFF"}
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              disabled={isLastStep}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-40"
            >
              Next Step →
            </button>
          </div>
        </div>

        {/* Right Column: Whiteboard */}
        <div className="lg:col-span-7">
          <Whiteboard visibleSteps={visibleSteps} currentStepId={currentStepId} />
        </div>
      </div>
    </div>
  );
}
