/**
 * SignBridge - Static A-Z Fingerspelling Recognition Engine
 * Implements invariant 3D hand basis transformation, joint curl metrics,
 * abduction distances, and continuous probability scoring.
 * Optimized for effortless, high-accuracy recognition in real webcam conditions.
 */

class StaticAlphabetRecognizer {
  constructor() {
    this.sensitivity = 'easy'; // 'easy' | 'balanced' | 'strict'
    this.minConfidenceThreshold = 0.48; // Forgiving default for smooth user experience
  }

  setSensitivity(mode) {
    this.sensitivity = mode;
    if (mode === 'easy') {
      this.minConfidenceThreshold = 0.45;
    } else if (mode === 'strict') {
      this.minConfidenceThreshold = 0.62;
    } else {
      this.minConfidenceThreshold = 0.52;
    }
  }

  /**
   * Main entry point: Classifies 21 3D landmarks into an A-Z letter
   * @param {Array<{x: number, y: number, z: number}>} landmarks - MediaPipe 21 landmarks
   * @param {string} handedness - 'Left' or 'Right'
   * @returns {{candidate: string|null, score: number, topCandidates: Array, details: Object}}
   */
  classify(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) {
      return { candidate: null, score: 0, topCandidates: [], details: null };
    }

    // 1. Extract hand metrics and invariant local coordinate system
    const metrics = this.extractHandMetrics(landmarks, handedness);

    // 2. Score all letters against geometric criteria
    const scores = {};
    scores['A'] = this.scoreLetterA(metrics);
    scores['B'] = this.scoreLetterB(metrics);
    scores['C'] = this.scoreLetterC(metrics);
    scores['D'] = this.scoreLetterD(metrics);
    scores['E'] = this.scoreLetterE(metrics);
    scores['F'] = this.scoreLetterF(metrics);
    scores['G'] = this.scoreLetterG(metrics);
    scores['H'] = this.scoreLetterH(metrics);
    scores['I'] = this.scoreLetterI(metrics);
    scores['K'] = this.scoreLetterK(metrics);
    scores['L'] = this.scoreLetterL(metrics);
    scores['M'] = this.scoreLetterM(metrics);
    scores['N'] = this.scoreLetterN(metrics);
    scores['O'] = this.scoreLetterO(metrics);
    scores['P'] = this.scoreLetterP(metrics);
    scores['Q'] = this.scoreLetterQ(metrics);
    scores['R'] = this.scoreLetterR(metrics);
    scores['S'] = this.scoreLetterS(metrics);
    scores['T'] = this.scoreLetterT(metrics);
    scores['U'] = this.scoreLetterU(metrics);
    scores['V'] = this.scoreLetterV(metrics);
    scores['W'] = this.scoreLetterW(metrics);
    scores['X'] = this.scoreLetterX(metrics);
    scores['Y'] = this.scoreLetterY(metrics);

    // 3. Sort candidates by score
    const sorted = Object.entries(scores)
      .map(([letter, score]) => ({ letter, score }))
      .sort((a, b) => b.score - a.score);

    const top = sorted[0];

    if (top && top.score >= this.minConfidenceThreshold) {
      return {
        candidate: top.letter,
        score: Math.min(1.0, top.score),
        topCandidates: sorted.slice(0, 3).filter((c) => c.score > 0.25),
        details: { scores, metrics }
      };
    }

    return {
      candidate: null,
      score: 0,
      topCandidates: sorted.slice(0, 3).filter((c) => c.score > 0.25),
      details: { scores, metrics }
    };
  }

  /**
   * Converts 3D landmarks into invariant hand coordinates and finger metrics
   */
  extractHandMetrics(lm, handedness) {
    const W = lm[0];    // Wrist
    const MCP9 = lm[9]; // Middle MCP
    const MCP5 = lm[5]; // Index MCP
    const MCP17 = lm[17]; // Pinky MCP

    // Palm scale: robust distance between wrist and middle MCP
    const palmScale = Math.hypot(MCP9.x - W.x, MCP9.y - W.y, MCP9.z - W.z) || 0.1;

    // Palm Center
    const palmCenter = {
      x: (W.x + MCP5.x + MCP9.x + MCP17.x) / 4,
      y: (W.y + MCP5.y + MCP9.y + MCP17.y) / 4,
      z: (W.z + MCP5.z + MCP9.z + MCP17.z) / 4
    };

    // Basis Vectors:
    const uy = {
      x: (MCP9.x - W.x) / palmScale,
      y: (MCP9.y - W.y) / palmScale,
      z: (MCP9.z - W.z) / palmScale
    };

    const sign = handedness === 'Left' ? -1 : 1;
    const vx = {
      x: (MCP17.x - MCP5.x) * sign,
      y: (MCP17.y - MCP5.y) * sign,
      z: (MCP17.z - MCP5.z) * sign
    };

    const uzRaw = {
      x: uy.y * vx.z - uy.z * vx.y,
      y: uy.z * vx.x - uy.x * vx.z,
      z: uy.x * vx.y - uy.y * vx.x
    };
    const uzLen = Math.hypot(uzRaw.x, uzRaw.y, uzRaw.z) || 1;
    const uz = { x: uzRaw.x / uzLen, y: uzRaw.y / uzLen, z: uzRaw.z / uzLen };

    const ux = {
      x: uy.y * uz.z - uy.z * uz.y,
      y: uy.z * uz.x - uy.x * uz.z,
      z: uy.x * uz.y - uy.y * uz.x
    };

    // Transform points into Hand Local Coordinates: p' = (P - W) / palmScale
    const local = lm.map((p) => {
      const dx = p.x - W.x;
      const dy = p.y - W.y;
      const dz = p.z - W.z;
      return {
        x: (dx * ux.x + dy * ux.y + dz * ux.z) / palmScale,
        y: (dx * uy.x + dy * uy.y + dz * uy.z) / palmScale,
        z: (dx * uz.x + dy * uz.y + dz * uz.z) / palmScale
      };
    });

    const dist = (i, j) => {
      return Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y, lm[i].z - lm[j].z) / palmScale;
    };

    const fingerExtensionRatio = (mcp, pip, dip, tip) => {
      const tipMcp = dist(tip, mcp);
      const perimeter = dist(mcp, pip) + dist(pip, dip) + dist(dip, tip);
      return perimeter > 0 ? tipMcp / perimeter : 0;
    };

    const curl = {
      thumb: dist(4, 2) / (dist(2, 3) + dist(3, 4)),
      index: fingerExtensionRatio(5, 6, 7, 8),
      middle: fingerExtensionRatio(9, 10, 11, 12),
      ring: fingerExtensionRatio(13, 14, 15, 16),
      pinky: fingerExtensionRatio(17, 18, 19, 20)
    };

    const isPointingDown = uy.y > 0.40;
    const isHorizontal = Math.abs(uy.x) > 0.50 && Math.abs(uy.y) < 0.70;

    return {
      lm,
      local,
      dist,
      curl,
      palmScale,
      palmCenter,
      isPointingDown,
      isHorizontal,
      handedness
    };
  }

  // --- Smooth, Forgiving Geometric Scoring Rules ---

  scoreLetterA(m) {
    // 4 fingers curled tight, thumb upright alongside index MCP
    if (m.curl.index > 0.65 || m.curl.middle > 0.65 || m.curl.ring > 0.65 || m.curl.pinky > 0.65) {
      return 0;
    }
    const fingersCurled = (m.curl.index < 0.55 ? 0.2 : 0.1) +
                          (m.curl.middle < 0.55 ? 0.2 : 0.1) +
                          (m.curl.ring < 0.55 ? 0.2 : 0.1) +
                          (m.curl.pinky < 0.55 ? 0.2 : 0.1);

    const thumbUpright = (m.local[4].y > 0.50 && m.dist(4, 5) < 0.55) ? 0.35 : 0.15;
    const thumbSide = (m.dist(4, 9) > 0.30) ? 0.25 : 0;
    return fingersCurled + thumbUpright + thumbSide;
  }

  scoreLetterB(m) {
    // 4 fingers straight up, thumb folded across palm
    if (m.curl.index < 0.72 || m.curl.middle < 0.72 || m.curl.ring < 0.70 || m.curl.pinky < 0.68) {
      return 0;
    }
    const fingersStraight = 0.55 +
      (m.curl.index > 0.80 ? 0.05 : 0) +
      (m.curl.middle > 0.80 ? 0.05 : 0) +
      (m.curl.ring > 0.78 ? 0.05 : 0) +
      (m.curl.pinky > 0.78 ? 0.05 : 0);

    const fingersTogether = (m.dist(8, 12) < 0.28 ? 0.1 : 0) +
                            (m.dist(12, 16) < 0.28 ? 0.05 : 0);
    const thumbFolded = (m.dist(4, 5) < 0.50 || m.dist(4, 17) < 0.70) ? 0.15 : 0;
    return fingersStraight + fingersTogether + thumbFolded;
  }

  scoreLetterC(m) {
    // All fingers curved smoothly in a C arc
    const fingersCurved = (m.curl.index >= 0.40 && m.curl.index <= 0.82 ? 0.2 : 0) +
                          (m.curl.middle >= 0.40 && m.curl.middle <= 0.82 ? 0.2 : 0) +
                          (m.curl.ring >= 0.40 && m.curl.ring <= 0.82 ? 0.2 : 0) +
                          (m.curl.pinky >= 0.40 && m.curl.pinky <= 0.82 ? 0.2 : 0);

    const thumbOpenArc = (m.dist(4, 8) >= 0.24 && m.dist(4, 8) <= 0.80) ? 0.25 : 0;
    return fingersCurved >= 0.6 ? fingersCurved + thumbOpenArc : 0;
  }

  scoreLetterD(m) {
    // Index straight up, other 3 curled forming loop with thumb
    if (m.curl.index < 0.75) return 0;
    if (m.curl.middle > 0.70 || m.curl.ring > 0.70 || m.curl.pinky > 0.70) return 0;

    const indexUp = 0.45;
    const thumbTouchesOthers = (m.dist(4, 12) < 0.38 || m.dist(4, 16) < 0.38) ? 0.35 : 0.15;
    const notTouchingIndex = m.dist(4, 8) > 0.25 ? 0.15 : 0;
    return indexUp + thumbTouchesOthers + notTouchingIndex;
  }

  scoreLetterE(m) {
    // All fingers curled down tight, thumb tucked underneath
    if (m.curl.index > 0.65 || m.curl.middle > 0.65 || m.curl.ring > 0.65 || m.curl.pinky > 0.65) {
      return 0;
    }
    const fingersCurled = 0.50;
    const thumbTucked = (m.local[4].y < m.local[8].y + 0.15 && m.dist(4, 8) < 0.40) ? 0.40 : 0.15;
    return fingersCurled + thumbTucked;
  }

  scoreLetterF(m) {
    // Thumb and index touch in circle, other 3 straight up
    if (m.curl.middle < 0.70 || m.curl.ring < 0.70 || m.curl.pinky < 0.68) return 0;
    const loop = (m.dist(4, 8) < 0.30) ? 0.45 : 0;
    if (loop === 0) return 0;
    const threeUp = 0.45;
    return loop + threeUp;
  }

  scoreLetterG(m) {
    // Index pointing out horizontally, thumb parallel, others curled
    if (m.isPointingDown) return 0;
    if (m.curl.index < 0.70) return 0;
    if (m.curl.middle > 0.65 || m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;

    const thumbParallel = (m.dist(4, 8) < 0.48) ? 0.40 : 0.15;
    return 0.50 + thumbParallel;
  }

  scoreLetterH(m) {
    // Index and Middle pointing horizontally together, others curled
    if (m.isPointingDown) return 0;
    if (m.curl.index < 0.70 || m.curl.middle < 0.70) return 0;
    if (m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;

    const twoTogether = (m.dist(8, 12) < 0.28) ? 0.40 : 0.20;
    return 0.50 + twoTogether;
  }

  scoreLetterI(m) {
    // Pinky straight up, others curled in fist
    if (m.curl.pinky < 0.75) return 0;
    if (m.curl.index > 0.65 || m.curl.middle > 0.65 || m.curl.ring > 0.65) return 0;

    const thumbFolded = m.dist(4, 13) < 0.55 ? 0.25 : 0.1;
    return 0.65 + thumbFolded;
  }

  scoreLetterK(m) {
    // Index straight up, middle angled forward/up, thumb touches middle PIP
    if (m.isPointingDown) return 0;
    if (m.curl.index < 0.75 || m.curl.middle < 0.65) return 0;
    if (m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;

    const thumbAtKnuckle = (m.dist(4, 10) < 0.38) ? 0.35 : 0.15;
    return 0.55 + thumbAtKnuckle;
  }

  scoreLetterL(m) {
    // Index straight up, Thumb extended sideways at ~90 degrees, others curled
    if (m.curl.index < 0.75) return 0;
    if (m.curl.middle > 0.68 || m.curl.ring > 0.68 || m.curl.pinky > 0.68) return 0;

    const thumbAbducted = (m.dist(4, 8) > 0.50 && m.dist(4, 5) > 0.38) ? 0.45 : 0;
    if (thumbAbducted === 0) return 0;
    return 0.50 + thumbAbducted;
  }

  scoreLetterM(m) {
    // 3 fingers draped over thumb
    if (m.curl.index > 0.70 || m.curl.middle > 0.70 || m.curl.ring > 0.70) return 0;
    const thumbTucked = (m.dist(4, 17) < 0.55) ? 0.35 : 0.15;
    return 0.50 + thumbTucked;
  }

  scoreLetterN(m) {
    // 2 fingers draped over thumb
    if (m.curl.index > 0.70 || m.curl.middle > 0.70) return 0;
    const thumbUnderMiddle = (m.dist(4, 9) < 0.45) ? 0.35 : 0.15;
    return 0.50 + thumbUnderMiddle;
  }

  scoreLetterO(m) {
    // All fingertips touch thumb tip forming an O loop
    const touchIndex = (m.dist(4, 8) < 0.30) ? 0.40 : 0;
    if (touchIndex === 0) return 0;
    const touchMiddle = (m.dist(4, 12) < 0.35) ? 0.25 : 0.10;
    const curved = (m.curl.index < 0.80 && m.curl.middle < 0.80) ? 0.25 : 0.10;
    return touchIndex + touchMiddle + curved;
  }

  scoreLetterP(m) {
    // Like K pose, but pointing downward in screen space
    if (!m.isPointingDown) return 0;
    if (m.curl.index < 0.68 || m.curl.middle < 0.62) return 0;
    return 0.75;
  }

  scoreLetterQ(m) {
    // Like G pose, but pointing downward in screen space
    if (!m.isPointingDown) return 0;
    if (m.curl.index < 0.68) return 0;
    const thumbParallel = (m.dist(4, 8) < 0.50) ? 0.30 : 0.15;
    return 0.55 + thumbParallel;
  }

  scoreLetterR(m) {
    // Index and Middle extended and crossed over each other
    if (m.curl.index < 0.72 || m.curl.middle < 0.72) return 0;
    if (m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;

    const crossed = (m.local[8].x > m.local[12].x && m.dist(8, 12) < 0.32) ? 0.45 : 0.15;
    return 0.45 + crossed;
  }

  scoreLetterS(m) {
    // Fist with thumb folded across FRONT of fingers
    if (m.curl.index > 0.65 || m.curl.middle > 0.65 || m.curl.ring > 0.65 || m.curl.pinky > 0.65) {
      return 0;
    }
    const thumbOverFront = (m.dist(4, 9) < 0.42 || m.local[4].z > 0.05) ? 0.45 : 0.20;
    return 0.45 + thumbOverFront;
  }

  scoreLetterT(m) {
    // Fist with thumb tucked between index and middle
    if (m.curl.middle > 0.65 || m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;
    const thumbTucked = (m.dist(4, 6) < 0.35) ? 0.45 : 0.15;
    return 0.45 + thumbTucked;
  }

  scoreLetterU(m) {
    // Index and Middle straight up and HELD CLOSE TOGETHER
    if (m.curl.index < 0.75 || m.curl.middle < 0.75) return 0;
    if (m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;

    const together = (m.dist(8, 12) <= 0.26) ? 0.45 : 0;
    if (together === 0) return 0;
    return 0.50 + together;
  }

  scoreLetterV(m) {
    // Index and Middle straight up and SPREAD APART in a V
    if (m.curl.index < 0.75 || m.curl.middle < 0.75) return 0;
    if (m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;

    const spread = (m.dist(8, 12) > 0.26) ? 0.45 : 0;
    if (spread === 0) return 0;
    return 0.50 + spread;
  }

  scoreLetterW(m) {
    // Index, Middle, Ring straight up and spread, Pinky curled
    if (m.curl.index < 0.72 || m.curl.middle < 0.72 || m.curl.ring < 0.72) return 0;
    if (m.curl.pinky > 0.62) return 0;

    const spread = (m.dist(8, 12) > 0.20 && m.dist(12, 16) > 0.20) ? 0.30 : 0.15;
    return 0.60 + spread;
  }

  scoreLetterX(m) {
    // Index hooked/bent like a trigger, others curled
    if (m.curl.index < 0.42 || m.curl.index > 0.80) return 0;
    if (m.curl.middle > 0.65 || m.curl.ring > 0.65 || m.curl.pinky > 0.65) return 0;
    return 0.80;
  }

  scoreLetterY(m) {
    // Thumb and Pinky extended out (Shaka), Middle 3 curled
    if (m.curl.pinky < 0.72) return 0;
    if (m.curl.index > 0.65 || m.curl.middle > 0.65 || m.curl.ring > 0.65) return 0;

    const thumbOut = (m.dist(4, 5) > 0.50) ? 0.40 : 0;
    if (thumbOut === 0) return 0;
    return 0.50 + thumbOut;
  }
}

if (typeof window !== 'undefined') {
  window.StaticAlphabetRecognizer = StaticAlphabetRecognizer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StaticAlphabetRecognizer };
}
