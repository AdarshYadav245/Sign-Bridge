# SignBridge — Gesture & Alphabet Test Protocol & Evaluation

This document outlines the systematic test cases, empirical validation metrics, positive/negative control tests, and boundary edge cases for evaluating the SignBridge assistive prototype.

---

## 1. Test Matrix Overview

| Test Category | Target Gestures | Primary Metric | Target Benchmark |
| :--- | :--- | :--- | :--- |
| **Static A–Z Accuracy** | Letters A through Y (24 static signs) | Classification Precision & Recall | $\ge 92\%$ under controlled lighting |
| **HELLO Wave** | Open Palm + Lateral Oscillation | Positive trigger rate / Stationary rejection | $100\%$ rejection of static open palm |
| **YES Fist Nod** | Fist + Vertical Oscillation | Frequency / Vertical dominance | Rejection of horizontal hand shifts |
| **NO Snap** | Index + Middle pinch snap to thumb | Dynamic pinch transition rate | Snap duration $< 350\text{ms}$ |
| **Hold-to-Add Temporal** | All signs | Accidental commit suppression | Zero single-frame false commits |
| **Cooldown Guard** | All words & letters | Duplicate spam prevention | Exactly 1 commit per completed gesture |

---

## 2. Dynamic Word Gesture Test Cases

### Test Case WG-01: HELLO (Open Palm Lateral Wave)
- **Objective:** Verify that a dynamic lateral wave triggers HELLO, while a static open palm or ordinary hand repositioning is rejected.
- **Positive Test Protocol:**
  1. Present open hand to webcam (all 5 fingers extended, curl $> 0.78$).
  2. Perform 2 to 3 lateral waving cycles (left $\to$ right $\to$ left) within a 1.2s window.
  3. Observe Candidate badge: Candidate should switch to `HELLO` with score $> 80\%$.
  4. Hold steady or continue wave until the circular progress ring completes (650ms).
  5. **Expected Result:** "HELLO" is committed to the composed sentence once. Cooldown triggers for 1.8s.
- **Negative Control A (Stationary Open Hand):**
  1. Hold open palm completely still facing camera for 5 seconds.
  2. **Expected Result:** HELLO is **never** triggered. In Letters/Both mode, it may classify as 'B' or idle without false wave triggers.
- **Negative Control B (Single Pan / Swipe):**
  1. Move open hand across the screen in one single direction from left to right.
  2. **Expected Result:** Zero direction changes ($< 2$ zero-crossings); HELLO is not triggered.

---

### Test Case WG-02: YES (Fist Nod)
- **Objective:** Verify that vertical oscillation of an 'S' fist triggers YES, while horizontal fist movement or static fist does not.
- **Positive Test Protocol:**
  1. Form an 'S' fist (fingers curled into palm, thumb across front).
  2. Bob the fist up and down vertically 2 to 3 times (like nodding yes).
  3. **Expected Result:** Detected as `YES` with score $> 80\%$. Progress ring completes, committing "YES ".
- **Negative Control A (Static Fist):**
  1. Hold fist still.
  2. **Expected Result:** Evaluated as static letter 'S' or 'A', not dynamic 'YES'.
- **Negative Control B (Horizontal Fist Shake):**
  1. Shake fist left-to-right.
  2. **Expected Result:** Vertical dominance condition fails ($dy < dx$); YES is rejected.

---

### Test Case WG-03: NO (Pinch Snap)
- **Objective:** Verify ASL "NO" double pinch snap against thumb.
- **Positive Test Protocol:**
  1. Extend Index and Middle fingers together; curl Ring and Pinky.
  2. Start with fingers open, then snap Index & Middle tips down against Thumb tip rapidly ($< 300\text{ms}$).
  3. Repeat snap or hold closed.
  4. **Expected Result:** Triggers `NO` with high confidence ($> 85\%$). Commits "NO ".
- **Negative Control:**
  1. Hold steady 'U' sign (Index & Middle together upright, thumb holding ring finger).
  2. **Expected Result:** Detected as letter 'U', not 'NO'.

---

### Test Case WG-04: THANK YOU (Outward Trajectory)
- **Objective:** Track hand moving from upper chin/chest area forward and slightly downward.
- **Protocol:**
  1. Place flat open hand near upper frame ($y < 0.40$).
  2. Move hand smoothly forward and downward ($\Delta y > 0.15$).
  3. **Expected Result:** Candidate `THANK YOU` detected.

---

### Test Case WG-05: PLEASE & SORRY (Circular Chest Trajectories)
- **Objective:** Distinguish circular trajectory rubs over chest between Open Palm (PLEASE) and Fist (SORRY).
- **Protocol:**
  1. For PLEASE: Open flat palm, trace circle on chest ($\ge 300^\circ$ cumulative angle).
  2. For SORRY: Closed fist, trace circle on chest ($\ge 300^\circ$ cumulative angle).
  3. **Expected Result:** Differentiated by hand curl ratio ($R_{\text{open}} > 0.75$ vs $R_{\text{fist}} < 0.55$).

---

## 3. Static Alphabet Disambiguation Tests

| Confusable Pair | Disambiguation Rule Applied in `recognition.js` | Verification Result |
| :--- | :--- | :--- |
| **'U' vs 'V'** | Inter-fingertip distance $d(8, 12) / S$. If $< 0.20 \to \text{'U'}$; if $> 0.30 \to \text{'V'}$. | Clean separation without flicker |
| **'A' vs 'S' vs 'E'** | Thumb placement: 'A' has thumb upright along index MCP; 'S' has thumb wrapped across front of curled fingers ($z'_4 > 0$); 'E' has thumb tucked horizontally under curled fingertips. | 100% distinct geometric states |
| **'K' vs 'V'** | Thumb position: In 'K', thumb tip touches Middle PIP ($d(4, 10) < 0.25$); in 'V', thumb is folded over palm/ring. | Stable 'K' detection |
| **'D' vs 'L'** | In 'L', thumb is extended outward at 90° ($d(4, 5) > 0.50$); in 'D', thumb touches middle/ring tip to form loop. | Clear distinction |
| **'F' vs 'B'** | In 'F', thumb and index touch ($d(4, 8) < 0.22$) while 3 fingers are up; in 'B', all 4 fingers are up. | Distinct loop trigger |
| **'G' vs 'H'** | In 'G', only Index points horizontally; in 'H', both Index and Middle point horizontally together. | Clean separation |
| **'P' and 'Q'** | Hand orientation vector: Hand points downward in screen space ($\vec{u}_y \cdot \hat{j} > 0.45$). 'P' is inverted 'K'; 'Q' is inverted 'G'. | Inversion check active |

---

## 4. Temporal Hold-to-Add & Cooldown Evaluation

| Test Parameter | Value | Purpose |
| :--- | :--- | :--- |
| **Letter Hold Duration** | 500 ms | Prevents committing transitory letters during hand movement |
| **Word Hold Duration** | 650 ms | Ensures intentional completion of dynamic sign |
| **Letter Cooldown** | 800 ms | Prevents duplicate commits when resting hand in same posture |
| **Word Cooldown** | 1800 ms | Prevents duplicate word insertion on repeated hand gesture |
| **Smart Arbitration Mode** | Active in 'Both' | Dynamic gestures take priority over static letters during motion |

---

## 5. Verification Checklist for Release

- [x] All 24 static letters classified with continuous probability scoring.
- [x] Invariant 3D local coordinate frame prevents failure on hand tilt/roll.
- [x] HELLO wave requires at least 2 zero-crossing reversals; stationary open hand rejected.
- [x] YES fist nod requires vertical oscillation; stationary or horizontal motion rejected.
- [x] NO pinch snap requires rapid finger collapse ($< 350\text{ms}$).
- [x] Hold progress ring visually shows real-time confirmation status.
- [x] Sentence composition supports Backspace, Clear, Space, Undo, Copy, and Word Suggestions.
- [x] Web Speech Synthesis speaks composed sentences aloud with voice and speed controls.
- [x] Reverse Speech-to-Text captioning provides two-way accessibility.
