# SignBridge

> **Real-time ASL Fingerspelling & Word Gesture Assistive Prototype**  
> *Built with HTML5, CSS3, Modern JavaScript, and MediaPipe Hands.*

[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pure Frontend](https://img.shields.io/badge/Stack-No%20Backend-success)](https://github.com)

---

## 1. Project Overview & Scope

**SignBridge** is a high-accuracy, client-side browser application designed to bridge communication gaps by recognizing American Sign Language (ASL) fingerspelling letters and essential conversational word-level gestures. Using a standard webcam, Google MediaPipe 21-landmark hand tracking, and geometric spatial algorithms, SignBridge translates human hand gestures into composed text, provides word suggestions, and reads them aloud using browser text-to-speech.

### Important Scope Note
Recognizing letters A–Z and basic word gestures is not the same as fluent sign language translation. Real-world ASL involves intricate facial grammar, body movement, spatial indexing, and two-handed signs. SignBridge is an educational assistive prototype and portfolio project focusing on robust fingerspelling recognition and a carefully scoped set of repeatable word gestures.

---

## 2. Key Features

- **High-Accuracy Invariant Hand Geometry:** Transforms 21 3D landmarks into a hand-local coordinate basis (Wrist $\to$ Knuckle axis, palm normal, transverse axis), making recognition invariant to camera distance, tilt, and wrist rotation.
- **A–Z Fingerspelling Classification:** Continuous multi-feature probability scoring distinguishing confusable letters (e.g., U vs V, A vs S vs E, K vs V, D vs L, F vs B, G vs H).
- **Dynamic Word Gesture Pipeline:**
  - `HELLO`: Requires repeated lateral palm waving (zero-crossing oscillation analysis; stationary open palms are strictly rejected).
  - `YES`: Vertical fist bobbing / nodding pattern ($dy \gg dx$).
  - `NO`: ASL double pinch snap of Index and Middle fingers against the thumb.
  - `THANK YOU`: Outward & downward hand path originating near chin/chest.
  - `PLEASE`: Circular chest rub trajectory with flat open palm.
  - `SORRY`: Circular chest rub trajectory with closed fist.
- **Visual Sign Guidance Chart & Reference Handbook:** Interactive alphabet and word gesture cards with search filtering, dual-action Practice coach & manual insertion chips.
- **Authentic ASL Alphabet Image Chart:** Full-size Gallaudet ASL Fingerspelling reference chart with click-to-expand lightbox zoom and custom image upload support.
- **Animated Looping Motion GIFs:** Dedicated looping visual motion demonstrations for all dynamic word gestures (`HELLO`, `YES`, `NO`, `THANK YOU`, `PLEASE`, `SORRY`).
- **Temporal Hold-to-Add Stabilization & Leaky Grace Period:** Fast, responsive holds (~360ms for letters, 450ms for words) backed by a 280ms grace window that tolerates camera auto-exposure and frame drops without wiping progress.
- **Configurable Sensitivity Modes:** Easy (fast & forgiving for beginner use), Balanced, and Strict accuracy thresholds selectable directly from the UI.
- **Duplicate Prevention Cooldown:** Automatic 800ms (letters) and 1200ms (words) cooldown preventing repeated spamming.
- **Smart Arbitration Mode:** Three modes (`Letters`, `Words`, `Both`). In `Both` mode, dynamic gestures take priority during movement, while static letters activate when the hand is still.
- **Interactive Sentence Studio:** Full sentence editing, Space, Backspace, Undo, Clear, one-click Copy to clipboard, and predictive word suggestions.
- **Text-to-Speech (TTS):** Browser SpeechSynthesis integration with voice selector, rate slider, and auto-speak toggle.
- **Reverse Speech-to-Text Captions:** Optional SpeechRecognition captioning enabling two-way conversation between signing and speaking users.
- **HUD Skeleton Overlay:** Glowing electric cyan joints, bone topology, pulsating fingertips, and hand bounding box.

---

## 3. Technology Stack

- **Runtime:** Pure client-side browser application (no backend server, no Java/Spring Boot required).
- **Computer Vision:** `@mediapipe/camera_utils` & `@mediapipe/hands` (CDN).
- **Styling:** CSS Custom Properties, Glassmorphism, CSS Grid & Flexbox, SVG HUD rings.
- **Speech API:** Web Speech API (`SpeechSynthesis` & `SpeechRecognition`).
- **Deployment:** GitHub repository root $\to$ GitHub Pages (HTTPS).

---

## 4. Project Structure

```
SLT/
├── index.html                 # Semantic UI layout and camera/canvas mount points
├── styles.css                 # Assistive dark theme, HUD styling, responsive grid
├── app.js                     # Application controller, hold-to-add, state machine
├── camera.js                  # Webcam lifecycle, permission negotiation, mirroring
├── landmarks.js               # MediaPipe Hands integration & canvas HUD overlay
├── recognition.js             # Invariant 3D coordinate basis & static A-Z engine
├── gesture-recognition.js     # Rolling motion history & dynamic gesture detectors
├── guidance-chart.js          # Interactive guidance handbook, live coach & search
├── sentence.js                # Composed text buffer, suggestions, undo & clipboard
├── speech.js                  # Speech synthesis (TTS) & reverse captioning (STT)
├── generate_assets.py         # Automated asset generation & validation script
├── assets/
│   ├── asl-alphabet-chart.png # Authentic ASL Fingerspelling reference image chart
│   └── gestures/              # Animated looping GIFs & vector SVGs (hello, yes, no, etc.)
├── tests/
│   ├── gesture-test-cases.md  # Detailed test suite, positive/negative controls
│   └── test-math.js           # Automated geometric verification test suite
├── .gitignore                 # Standard ignore patterns
└── README.md                  # Project overview and deployment guide
```

---

## 5. How to Run Locally

Because SignBridge accesses the webcam and MediaPipe WebAssembly models via CDN, it should be served over HTTP/HTTPS rather than opened directly as a `file://` URL in some browsers.

### Option A: Python Built-in Server
```bash
# In the project root directory
python -m http.server 8000
```
Then open `http://localhost:8000` in Google Chrome, Microsoft Edge, or Mozilla Firefox.

### Option B: Node.js (npx serve)
```bash
npx serve .
```

---

## 6. How to Deploy with GitHub Pages

1. **Initialize Git & Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of SignBridge assistive application"
   git branch -M main
   git remote add origin https://github.com/<your-username>/SignBridge.git
   git push -u origin main
   ```
2. **Enable GitHub Pages:**
   - In your repository, go to **Settings** $\to$ **Pages**.
   - Under **Build and deployment** $\to$ **Source**, choose **Deploy from a branch**.
   - Select `main` branch and `/ (root)` folder.
   - Click **Save**.
3. **Access Your Live HTTPS Site:**
   - Within 1–2 minutes, GitHub Pages will deploy your site at:  
     `https://<your-username>.github.io/SignBridge/`
   - *Note:* Webcams require secure contexts (`https://` or `localhost`), so GitHub Pages HTTPS works out of the box!

---

## 7. Privacy & Safety Note

- **100% In-Browser Execution:** Video streams and hand landmark computations are processed locally inside your browser using WebAssembly. No camera video or images are sent to or stored on external servers.
- **Explicit Camera Permission:** The webcam is activated only when the user explicitly clicks the **Start Camera** button.
- **Educational & Assistive Scope:** SignBridge is a technology demonstrator and portfolio prototype. It is not a replacement for qualified ASL interpreters in medical, legal, or emergency situations.

---

## 8. Release Checklist

- [x] Existing A–Z recognition functions accurately under varied hand rotations.
- [x] Letter mode, Word mode, and Combined mode are clearly segregated.
- [x] HELLO strictly requires lateral wave oscillation; stationary open palm is rejected.
- [x] Cooldown mechanisms prevent duplicate commits.
- [x] Real-time hold-to-confirm progress ring gives clear visual feedback.
- [x] Composed text can be edited, copied, cleared, and spoken.
- [x] Speech synthesis functions across modern browsers.
- [x] Camera cleanly starts and stops hardware lock without memory leaks.
- [x] Static site is 100% ready for GitHub Pages root deployment.
