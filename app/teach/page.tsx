"use client";

import { useState } from "react";
import PhotoAvatarSetup from "@/components/PhotoAvatarSetup";
import TeachSession from "@/components/TeachSession";
import type { LessonScript } from "@/types";

const SAMPLE_TOPICS = [
  { topic: "Quadratic Equations", grade: 10 },
  { topic: "Pythagorean Theorem", grade: 8 },
  { topic: "Linear Equations in Two Variables", grade: 9 },
  { topic: "Calculus: Differentiation & Slopes", grade: 11 },
  { topic: "Trigonometric Ratios (Sin, Cos, Tan)", grade: 10 },
];

export default function TeachPage() {
  const [photo, setPhoto] = useState<{ url: string; provider: "d-id" | "faceMeshFallback" } | null>(null);
  const [script, setScript] = useState<LessonScript | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  const [topicInput, setTopicInput] = useState("Quadratic equations");
  const [gradeInput, setGradeInput] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [didFallbackNotice, setDidFallbackNotice] = useState<string | null>(null);

  async function startLesson(topic: string, grade: number) {
    setLoading(true);
    setErrorMsg(null);
    setDidFallbackNotice(null);
    setLoadingStatus("Generating lesson script...");

    try {
      // 1. Generate lesson script
      const lessonRes = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade }),
      });

      if (!lessonRes.ok) {
        throw new Error("Failed to generate lesson script.");
      }

      const lessonScript: LessonScript = await lessonRes.json();

      // 2. Generate D-ID Avatar Video if provider is d-id
      if (photo?.provider === "d-id") {
        setLoadingStatus("Generating D-ID talking avatar video...");
        try {
          const avatarRes = await fetch("/api/generate-avatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoUrl: photo.url, script: lessonScript }),
          });

          const avatarData = await avatarRes.json();

          if (!avatarRes.ok) {
            throw new Error(avatarData.error || "D-ID API call failed.");
          }

          if (avatarData.video?.videoUrl) {
            setVideoUrl(avatarData.video.videoUrl);
            setScript({ ...lessonScript, steps: avatarData.steps || lessonScript.steps });
          } else {
            throw new Error("D-ID did not return a valid video URL.");
          }
        } catch (didErr: any) {
          console.warn("D-ID generation error, falling back to client-side avatar:", didErr);
          setDidFallbackNotice(didErr.message || "D-ID API key missing or image URL not publicly reachable. Using free living photo fallback.");
          setScript(lessonScript);
        }
      } else {
        setScript(lessonScript);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred starting the lesson.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setScript(null);
    setVideoUrl(undefined);
    setErrorMsg(null);
    setDidFallbackNotice(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              🎓
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">MathLab /teach Session</h1>
              <p className="text-xs text-slate-400">D-ID Talking Avatar Teacher + Interactive Whiteboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
              Provider: {photo?.provider === "d-id" ? "D-ID Talk Video" : photo?.provider === "faceMeshFallback" ? "Free Living Photo" : "Not Configured"}
            </span>
          </div>
        </header>

        {didFallbackNotice && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span><strong>Notice:</strong> {didFallbackNotice}</span>
            </div>
            <button
              onClick={() => setDidFallbackNotice(null)}
              className="text-amber-400 hover:text-amber-200 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Setup Screen */}
        {!script && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step 1: Avatar Setup */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-base font-semibold text-white">Teacher Avatar Setup</h2>
              </div>
              <PhotoAvatarSetup onReady={(url, provider) => setPhoto({ url, provider })} />
            </div>

            {/* Step 2: Lesson Generator */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-base font-semibold text-white">Choose Math Lesson Topic</h2>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-6 space-y-5 shadow-xl">
                <div>
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block mb-2">Math Topic</label>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Quadratic equations, Calculus"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block mb-2">Target Grade (6 - 12)</label>
                  <input
                    type="number"
                    min={6}
                    max={12}
                    value={gradeInput}
                    onChange={(e) => setGradeInput(parseInt(e.target.value) || 10)}
                    className="w-28 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-2">Quick Sample Topics:</label>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TOPICS.map((item) => (
                      <button
                        key={item.topic}
                        type="button"
                        onClick={() => {
                          setTopicInput(item.topic);
                          setGradeInput(item.grade);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          topicInput === item.topic
                            ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                        }`}
                      >
                        {item.topic} (Gr {item.grade})
                      </button>
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="button"
                  disabled={loading || !photo}
                  onClick={() => startLesson(topicInput, gradeInput)}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{loadingStatus}</span>
                    </>
                  ) : (
                    <span>🚀 Start /teach Lesson</span>
                  )}
                </button>
                {!photo && (
                  <p className="text-xs text-center text-amber-400">Please select or upload an avatar photo first.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Session Screen */}
        {script && (
          <TeachSession
            script={script}
            faceVideoUrl={videoUrl}
            photoDataUrl={photo?.url}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
