// mathlab/app/api/generate-avatar/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateAvatarVideo } from "@/lib/avatarService";
import type { LessonScript } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, script } = (await req.json()) as { photoUrl: string; script: LessonScript };

    if (!photoUrl || !script || !script.steps) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const fullText = script.steps.map((s) => s.spokenText).join(" ");
    const video = await generateAvatarVideo({ photoUrl, script: fullText });

    const totalWords = script.steps.reduce((sum, s) => sum + s.spokenText.split(" ").length, 0) || 1;
    let cursor = 0;
    const stepsWithTiming = script.steps.map((s) => {
      const wordFraction = s.spokenText.split(" ").length / totalWords;
      const duration = video.durationSeconds * wordFraction;
      const timed = { ...s, startTime: cursor, endTime: cursor + duration };
      cursor += duration;
      return timed;
    });

    return NextResponse.json({ video, steps: stepsWithTiming });
  } catch (err: any) {
    console.error("Generate avatar route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate D-ID avatar video" },
      { status: 500 }
    );
  }
}
