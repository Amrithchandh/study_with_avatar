// mathlab/app/api/generate-lesson/route.ts

import { NextRequest, NextResponse } from "next/server";
import type { LessonScript, LessonStep } from "@/types";

const LESSON_SYSTEM_PROMPT = `You are Prof. Sharma, a CBSE math teacher creating a spoken micro-lesson.
Given a math concept and a target grade (6–12), output ONLY valid JSON,
an array of steps. Each step is one breath-sized chunk of speech
(max 25 words) paired with one whiteboard action.
Schema per step: { "id": number, "spokenText": string,
"whiteboardAction": { "type": "write_equation"|"highlight"|"plot_graph"|"circle_answer"|"clear",
"latex": string|null, "target": string|null, "graphFn": string|null },
"gesture": "point_left"|"point_right"|"open_palms"|"idle" }
Rules: 6-12 short steps, simple encouraging language, every equation
written before it's referenced in speech. Output nothing except JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { topic = "Quadratic equations", grade = 10 } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      const completion = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          system: LESSON_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Topic: ${topic}. Grade: ${grade}.` }],
        }),
      });

      if (completion.ok) {
        const data = await completion.json();
        let rawText = data.content?.[0]?.text ?? "";
        
        // Strip markdown code fences if present
        rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
        const steps: LessonStep[] = JSON.parse(rawText);
        const script: LessonScript = { topic, grade, steps };
        return NextResponse.json(script);
      }
    }

    // Fallback when ANTHROPIC_API_KEY is not set or API fails
    console.warn("Using offline mock lesson generator for topic:", topic);
    const mockScript = generateMockScript(topic, grade);
    return NextResponse.json(mockScript);
  } catch (err) {
    console.error("Error generating lesson, using fallback script:", err);
    const mockScript = generateMockScript("Quadratic Equations", 10);
    return NextResponse.json(mockScript);
  }
}

function generateMockScript(topic: string, grade: number): LessonScript {
  const steps: LessonStep[] = [
    {
      id: 1,
      spokenText: `Welcome class! Today we are learning about ${topic} for Grade ${grade}.`,
      whiteboardAction: { type: "write_equation", latex: `\\text{Topic: } \\text{${topic}}` },
      gesture: "open_palms",
    },
    {
      id: 2,
      spokenText: "Let us start with the standard general equation form.",
      whiteboardAction: { type: "write_equation", latex: "ax^2 + bx + c = 0" },
      gesture: "point_left",
    },
    {
      id: 3,
      spokenText: "Here, a, b, and c are constants, and a must never equal zero.",
      whiteboardAction: { type: "highlight", latex: "a \\neq 0" },
      gesture: "point_left",
    },
    {
      id: 4,
      spokenText: "To solve for x, we use the famous quadratic formula!",
      whiteboardAction: { type: "write_equation", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
      gesture: "open_palms",
    },
    {
      id: 5,
      spokenText: "The expression inside the square root is called the Discriminant.",
      whiteboardAction: { type: "highlight", latex: "D = b^2 - 4ac" },
      gesture: "point_right",
    },
    {
      id: 6,
      spokenText: "Let us plot a quadratic parabola curve on our whiteboard.",
      whiteboardAction: { type: "plot_graph", graphFn: "x^2 - 4" },
      gesture: "point_right",
    },
    {
      id: 7,
      spokenText: "Notice how the curve crosses the x-axis at x = -2 and x = 2. These are the roots!",
      whiteboardAction: { type: "circle_answer", latex: "x = \\pm 2" },
      gesture: "open_palms",
    },
  ];

  return { topic, grade, steps };
}
