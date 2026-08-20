// mathlab/lib/lipSyncFallback.ts
//
// FREE alternative to the D-ID API. Runs entirely in the browser.
// Uses face-api.js to find facial landmarks on the uploaded photo once,
// then redraws the photo every animation frame with the mouth region
// scaled based on live speech events. Also handles eye blinking.

import * as faceapi from "face-api.js";

export interface FaceLandmarkRig {
  mouth: faceapi.Point[];
  leftEye: faceapi.Point[];
  rightEye: faceapi.Point[];
  imageWidth: number;
  imageHeight: number;
}

let modelsLoaded = false;

export async function loadFaceModels(modelUrl = "/models"): Promise<boolean> {
  if (modelsLoaded) return true;
  if (typeof window === "undefined") return false;

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
    modelsLoaded = true;
    return true;
  } catch (err) {
    console.warn("Failed to load face-api models from", modelUrl, err);
    return false;
  }
}

// Step 1: run once when photo is uploaded — validates + extracts rig points
export async function buildFaceRig(imageEl: HTMLImageElement): Promise<FaceLandmarkRig | null> {
  const loaded = await loadFaceModels();
  if (!loaded) return null;

  try {
    const detection = await faceapi
      .detectSingleFace(imageEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detection) return null;

    return {
      mouth: detection.landmarks.getMouth(),
      leftEye: detection.landmarks.getLeftEye(),
      rightEye: detection.landmarks.getRightEye(),
      imageWidth: imageEl.naturalWidth || imageEl.width,
      imageHeight: imageEl.naturalHeight || imageEl.height,
    };
  } catch (err) {
    console.warn("Face detection error:", err);
    return null;
  }
}

// Step 2: called every animation frame while speaking
export function drawTalkingFrame(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  rig: FaceLandmarkRig,
  mouthOpen: number,
  isBlinking: boolean
) {
  const w = rig.imageWidth || photo.naturalWidth || photo.width;
  const h = rig.imageHeight || photo.naturalHeight || photo.height;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(photo, 0, 0, w, h);

  if (mouthOpen > 0.05) {
    const mouthBox = boundingBox(rig.mouth, 14);
    const scaleY = 1 + mouthOpen * 0.5;
    ctx.save();
    ctx.translate(mouthBox.cx, mouthBox.cy);
    ctx.scale(1, scaleY);
    ctx.translate(-mouthBox.cx, -mouthBox.cy);
    ctx.drawImage(
      photo,
      mouthBox.x, mouthBox.y, mouthBox.w, mouthBox.h,
      mouthBox.x, mouthBox.y, mouthBox.w, mouthBox.h
    );
    ctx.restore();
  }

  if (isBlinking) {
    for (const eye of [rig.leftEye, rig.rightEye]) {
      const box = boundingBox(eye, 4);
      ctx.fillStyle = getAverageSkinTone(ctx, box);
      ctx.fillRect(box.x, box.y, box.w, box.h * 0.5);
    }
  }
}

function boundingBox(points: faceapi.Point[], pad: number) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.max(0, Math.min(...xs) - pad);
  const y = Math.max(0, Math.min(...ys) - pad);
  const w = Math.max(1, Math.max(...xs) - x + pad * 2);
  const h = Math.max(1, Math.max(...ys) - y + pad * 2);
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

function getAverageSkinTone(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }) {
  try {
    const data = ctx.getImageData(Math.floor(box.x), Math.max(0, Math.floor(box.y - 10)), 1, 1).data;
    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  } catch {
    return "#d19a66";
  }
}

export function estimateMouthOpenFromWord(word: string): number {
  const vowels = (word.match(/[aeiouAEIOU]/g) || []).length;
  return Math.min(1, 0.3 + vowels * 0.25);
}
