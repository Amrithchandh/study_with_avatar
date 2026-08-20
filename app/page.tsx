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

export default function Home() {
  const [photo, setPhoto] = useState<{ url: string; provider: "d-id" | "faceMeshFallback" } | null>(null);
  const [script, setScript] = useState<LessonScript | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  const [topicInput, setTopicInput] = useState("Quadratic equations");
  const [gradeInput, setGradeInput] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startLesson(topic: string, grade: number) {
    setLoading(true);
    setErrorMsg(null);
    setLoadingStatus("Generating interactive lesson script...");

    try {
      const lessonRes = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade }),
      });

      if (!lessonRes.ok) {
        throw new Error("Failed to generate lesson script.");
      }

      const lessonScript: LessonScript = await lessonRes.json();

      if (photo?.provider === "d-id") {
        setLoadingStatus("Rendering D-ID talking avatar video...");
        const avatarRes = await fetch("/api/generate-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: photo.url, script: lessonScript }),
        });

        if (!avatarRes.ok) {
          const errData = await avatarRes.json();
          throw new Error(errData.error || "D-ID avatar video generation failed.");
        }

        const { video, steps } = await avatarRes.json();
        setVideoUrl(video.videoUrl);
        setScript({ ...lessonScript, steps });
      } else {
        setScript(lessonScript);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setScript(null);
    setVideoUrl(undefined);
    setErrorMsg(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              📐
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">MathLab AI Teacher</h1>
              <p className="text-xs text-slate-400">Photo-to-Talking Avatar Micro-Lessons with Live Whiteboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
              Next.js 16 • React 19
            </span>
          </div>
        </header>

        {/* Screen 1: Photo & Topic Setup */}
        {!script && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step A: Photo Setup */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-base font-semibold text-white">Teacher Avatar Setup</h2>
              </div>
              <PhotoAvatarSetup onReady={(url, provider) => setPhoto({ url, provider })} />
            </div>

            {/* Step B: Topic Selection */}
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
                    placeholder="e.g. Quadratic equations, Trigonometry"
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
                  <label className="text-xs font-medium text-slate-400 block mb-2">Or pick a Quick Sample Topic:</label>
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
                  disabled={loading}
                  onClick={() => startLesson(topicInput, gradeInput)}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{loadingStatus}</span>
                    </>
                  ) : (
                    <span>🚀 Start Interactive Lesson</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen 2: Active Lesson Session */}
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
