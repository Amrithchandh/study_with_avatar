"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { LessonStep } from "../types";

interface Props {
  visibleSteps: LessonStep[];
  currentStepId: number;
}

export default function Whiteboard({ visibleSteps, currentStepId }: Props) {
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);

  const graphStep = [...visibleSteps].reverse().find((s) => s.whiteboardAction.type === "plot_graph");

  useEffect(() => {
    if (!graphStep?.whiteboardAction.graphFn || !graphCanvasRef.current) return;
    drawGraph(graphCanvasRef.current, graphStep.whiteboardAction.graphFn);
  }, [graphStep]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 min-h-[400px] flex flex-col justify-between space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-slate-400 font-mono text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Interactive Whiteboard
        </h2>
        <span className="text-xs text-slate-500 font-mono">Step {currentStepId}</span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2">
        {visibleSteps.length === 0 ? (
          <p className="text-slate-600 italic text-sm">Whiteboard ready. Generating lesson content...</p>
        ) : (
          visibleSteps.map((step) => {
            const action = step.whiteboardAction;
            const isCurrent = step.id === currentStepId;

            if (action.type === "clear") return null;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all duration-500 ${
                  isCurrent
                    ? "bg-slate-900/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20"
                    : "bg-slate-900/30 border-slate-800 opacity-70"
                }`}
              >
                {action.type === "write_equation" && action.latex && (
                  <div className="text-xl text-white py-1">
                    <RenderKaTeX latex={action.latex} />
                  </div>
                )}
                {action.type === "highlight" && action.latex && (
                  <div className="text-xl text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-1.5 inline-block">
                    <RenderKaTeX latex={action.latex} />
                  </div>
                )}
                {action.type === "circle_answer" && action.latex && (
                  <div className="text-xl text-emerald-300 border-2 border-emerald-400 rounded-full px-5 py-1.5 inline-block bg-emerald-500/10 font-bold shadow-lg">
                    <RenderKaTeX latex={action.latex} />
                  </div>
                )}
                {action.type === "plot_graph" && action.graphFn && (
                  <div className="text-sm text-indigo-300 font-mono">
                    Plotting function: y = {action.graphFn}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {graphStep && (
        <div className="mt-4 border border-slate-800 rounded-lg p-2 bg-slate-900/80">
          <p className="text-xs text-slate-400 mb-1 font-mono">Graph Visualization: {graphStep.whiteboardAction.graphFn}</p>
          <canvas ref={graphCanvasRef} width={400} height={240} className="w-full bg-slate-950 rounded border border-slate-800" />
        </div>
      )}
    </div>
  );
}

function RenderKaTeX({ latex }: { latex: string }) {
  try {
    const html = katex.renderToString(latex, { throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span className="font-mono">{latex}</span>;
  }
}

function drawGraph(canvas: HTMLCanvasElement, fnExpr: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width, h = canvas.height;
  const scale = 25, originX = w / 2, originY = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Draw grid lines
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += scale) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += scale) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw axes
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, originY); ctx.lineTo(w, originY);
  ctx.moveTo(originX, 0); ctx.lineTo(originX, h);
  ctx.stroke();

  // Evaluator function
  const evalFn = (x: number): number => {
    try {
      const sanitized = fnExpr
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/(\d)x/g, "$1*x")
        .replace(/x\^(\d+)/g, "Math.pow(x, $1)");
      
      // eslint-disable-next-line no-new-func
      const fn = new Function("x", `"use strict"; return (${sanitized});`);
      return Number(fn(x));
    } catch {
      return NaN;
    }
  };

  // Plot curve
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let first = true;

  for (let px = 0; px <= w; px += 2) {
    const x = (px - originX) / scale;
    const y = evalFn(x);
    if (isNaN(y) || !isFinite(y)) {
      first = true;
      continue;
    }
    const py = originY - y * scale;
    if (first) {
      ctx.moveTo(px, py);
      first = false;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}
