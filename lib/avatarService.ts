// mathlab/lib/avatarService.ts
//
// Server-only module
// Flow: photo URL + full concatenated speech text -> D-ID creates a talking head video -> poll until ready.

import type { GeneratedAvatarVideo } from "../types";

const DID_API_BASE = "https://api.d-id.com";

interface CreateTalkParams {
  photoUrl: string;      // publicly accessible URL of the uploaded photo
  script: string;        // full spoken text
  voiceId?: string;
}

export async function generateAvatarVideo({
  photoUrl,
  script,
  voiceId = "en-US-JennyNeural",
}: CreateTalkParams): Promise<GeneratedAvatarVideo> {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) {
    throw new Error("DID_API_KEY environment variable is not set. Please use the free living photo fallback option or set DID_API_KEY.");
  }

  if (photoUrl.startsWith("data:")) {
    throw new Error("D-ID API requires a publicly hosted image HTTP/HTTPS URL, not a base64 data URI. Use the free living photo option for local file uploads.");
  }

  // 1. Kick off video generation
  const createRes = await fetch(`${DID_API_BASE}/talks`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: photoUrl,
      script: {
        type: "text",
        input: script,
        provider: { type: "microsoft", voice_id: voiceId },
      },
      config: {
        fluent: true,
        pad_audio: 0.2,
        stitch: true,
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`D-ID create talk failed: ${createRes.status} ${await createRes.text()}`);
  }

  const { id: talkId } = await createRes.json();

  // 2. Poll until the render is done
  const video = await pollUntilReady(talkId, apiKey);
  return video;
}

async function pollUntilReady(talkId: string, apiKey: string): Promise<GeneratedAvatarVideo> {
  const maxAttempts = 30;
  const delayMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${DID_API_BASE}/talks/${talkId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
      },
    });
    const data = await res.json();

    if (data.status === "done") {
      return {
        videoUrl: data.result_url,
        durationSeconds: data.duration ?? 0,
        provider: "d-id",
      };
    }
    if (data.status === "error" || data.status === "rejected") {
      throw new Error(`D-ID render failed: ${JSON.stringify(data)}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error("D-ID render timed out");
}
