# MathLab — Photo → Talking Avatar Teacher: Full Workflow

## The technical picture

| Body part | Achievable from 1 photo? | How |
|---|---|---|
| Eyes (blink, gaze) | ✅ Yes, realistically | Photo-to-video avatar API (D-ID) or Face Mesh |
| Lips (speech sync) | ✅ Yes, realistically | Audio-driven / Speech event lip sync |
| Head (tilt, nod) | ✅ Yes, subtly | Canvas/Video layer |
| Hands / arms | ❌ No | Rigged SVG body layer |

## End-to-end pipeline

1. **UPLOAD PHOTO**: User uploads photo → landmark validation (`face-api.js`).
2. **GENERATE LESSON SCRIPT**: LLM (Claude) / offline mock script array (`LessonStep[]`).
3. **WHITEBOARD & AVATAR SYNC**: Step-by-step playback with Web Speech API and KaTeX canvas.
