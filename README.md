# MathLab Avatar Teacher — Study With Avatar

Photo-to-Talking Avatar Micro-Lessons with Live Interactive Whiteboard built with Next.js 16, React 19, KaTeX, and face-api.js.

## 🚀 Features

- **Avatar Teacher Engine**:
  - ⚡ **Free Living Photo Mode**: Runs 100% in browser using MediaPipe / `face-api.js` facial landmarks for live mouth-warping lip sync & blinking.
  - 🎬 **Paid D-ID Talk API**: Realistic photo-to-video avatar generation.
  - 🎨 **SVG Rigged Body**: Stylized SVG torso with responsive arm gestures (`point_left`, `point_right`, `open_palms`).
- **Interactive Whiteboard**:
  - Live KaTeX math expression rendering.
  - Step highlighting & circled answer badges.
  - HTML5 Canvas mathematical function plotter (polynomials, sine/cosine, etc.).
- **Lesson Script Generator**:
  - Anthropic Claude API integration for generating structured CBSE math lessons.
  - Built-in offline fallback mock generator for instant zero-config testing.
- **Web Speech API**: Browser-native text-to-speech with word-boundary event tracking.

---

## 🛠️ Quick Start (Run Locally)

### 1. Install Dependencies
```bash
npm install
```

### 2. Download Face-API Models
Model weight files (`tiny_face_detector` and `face_landmark_68`) are located in `public/models/`.

### 3. Environment Variables (Optional)
Create `.env.local` for server-side API keys:
```env
ANTHROPIC_API_KEY=...    # Optional: for Claude lesson generation
DID_API_KEY=...          # Optional: for D-ID realistic video avatar
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
