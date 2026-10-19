/**
 * SignBridge - Dynamic Word Gesture Recognition Engine
 * Implements rolling motion history, velocity filtering, and forgiving trajectory analysis
 * for ASL word gestures: HELLO, YES, NO, THANK YOU, PLEASE, SORRY.
 * Tuned for natural human movement and webcam responsiveness.
 */

class GestureRecognizer {
  constructor() {
    this.history = [];
    this.maxHistoryDurationMs = 1800; // 1.8-second rolling window for natural pace
    this.sensitivity = 'easy';
    this.minConfidenceThreshold = 0.44; // Forgiving threshold for effortless triggering
    this.lastTriggeredWord = null;
    this.lastTriggeredTime = 0;
    this.cooldownDurationMs = 1200; // 1.2s cooldown
  }

  setSensitivity(mode) {
    this.sensitivity = mode;
    if (mode === 'easy') {
      this.minConfidenceThreshold = 0.44;
    } else if (mode === 'strict') {
      this.minConfidenceThreshold = 0.62;
    } else {
      this.minConfidenceThreshold = 0.50;
    }
  }

  resetHistory() {
    this.history = [];
  }

  /**
   * Main classification method called every frame
   */
  classify(landmarks, handedness = 'Right', currentTime = performance.now()) {
    if (!landmarks || landmarks.length < 21) {
      this.resetHistory();
      return { candidate: null, score: 0, details: null, inCooldown: false };
    }

    const inCooldown = (currentTime - this.lastTriggeredTime) < this.cooldownDurationMs;

    // 1. Analyze current frame
    const frameData = this.analyzeCurrentFrame(landmarks, handedness, currentTime);

    // 2. Add to rolling window
    this.history.push(frameData);
    const cutoffTime = currentTime - this.maxHistoryDurationMs;
    while (this.history.length > 0 && this.history[0].timestamp < cutoffTime) {
      this.history.shift();
    }

    // Need at least 8 frames (~250ms) of tracking to assess motion
    if (this.history.length < 8) {
      return { candidate: null, score: 0, details: { historyCount: this.history.length }, inCooldown };
    }

    // 3. Evaluate each dynamic gesture candidate
    const scores = {};
    scores['HELLO'] = this.detectHelloWave();
    scores['YES'] = this.detectYesNod();
    scores['NO'] = this.detectNoPinch();
    scores['THANK YOU'] = this.detectThankYouOutward();
    scores['PLEASE'] = this.detectPleaseCircular();
    scores['SORRY'] = this.detectSorryCircular();

    // 4. Determine best candidate
    let bestWord = null;
    let highestScore = 0;

    for (const [word, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestWord = word;
      }
    }

    if (highestScore >= this.minConfidenceThreshold) {
      return {
        candidate: bestWord,
        score: Math.min(1.0, highestScore),
        details: { scores },
        inCooldown
      };
    }

    return { candidate: null, score: 0, details: { scores }, inCooldown };
  }

  triggerCommit(word, currentTime = performance.now()) {
    this.lastTriggeredWord = word;
    this.lastTriggeredTime = currentTime;
    this.resetHistory();
  }

  analyzeCurrentFrame(lm, handedness, timestamp) {
    const W = lm[0];
    const MCP9 = lm[9];
    const palmScale = Math.hypot(MCP9.x - W.x, MCP9.y - W.y, MCP9.z - W.z) || 0.1;

    const palmCenter = {
      x: (lm[0].x + lm[5].x + lm[9].x + lm[17].x) / 4,
      y: (lm[0].y + lm[5].y + lm[9].y + lm[17].y) / 4,
      z: (lm[0].z + lm[5].z + lm[9].z + lm[17].z) / 4
    };

    const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y, lm[i].z - lm[j].z) / palmScale;

    const fingerExtension = (mcp, pip, dip, tip) => {
      const tipMcp = dist(tip, mcp);
      const perimeter = dist(mcp, pip) + dist(pip, dip) + dist(dip, tip);
      return perimeter > 0 ? tipMcp / perimeter : 0;
    };

    const curl = {
      thumb: dist(4, 2) / (dist(2, 3) + dist(3, 4)),
      index: fingerExtension(5, 6, 7, 8),
      middle: fingerExtension(9, 10, 11, 12),
      ring: fingerExtension(13, 14, 15, 16),
      pinky: fingerExtension(17, 18, 19, 20)
    };

    // Forgiving definitions
    const isOpenPalm = curl.index > 0.68 && curl.middle > 0.68 && curl.ring > 0.65 && curl.pinky > 0.62;
    const isFist = curl.index < 0.65 && curl.middle < 0.65 && curl.ring < 0.65 && curl.pinky < 0.65;
    const pinchDist = dist(4, 8);
    const pinchMiddleDist = dist(4, 12);

    return {
      timestamp,
      palmCenter,
      palmScale,
      curl,
      isOpenPalm,
      isFist,
      pinchDist,
      pinchMiddleDist
    };
  }

  // --- Dynamic Detectors ---

  /**
   * HELLO: Open palm + lateral wave motion
   */
  detectHelloWave() {
    const n = this.history.length;
    if (n < 10) return 0;

    // Check open palm consistency (at least 60% of frames)
    let openCount = 0;
    for (let i = 0; i < n; i++) {
      if (this.history[i].isOpenPalm) openCount++;
    }
    const openRatio = openCount / n;
    if (openRatio < 0.55) return 0;

    const palmScale = this.history[n - 1].palmScale;
    const xs = this.history.map((h) => h.palmCenter.x / palmScale);

    let directionChanges = 0;
    let lastVel = 0;
    let totalLateralTravel = 0;
    const minStep = 0.025; // Sensible threshold for natural hand movements

    for (let i = 1; i < n; i++) {
      const dx = xs[i] - xs[i - 1];
      totalLateralTravel += Math.abs(dx);

      if (Math.abs(dx) > minStep) {
        const vel = Math.sign(dx);
        if (lastVel !== 0 && vel !== lastVel) {
          directionChanges++;
        }
        lastVel = vel;
      }
    }

    // Waving requires at least 1 clear direction change and travel >= 0.30
    if (directionChanges >= 1 && totalLateralTravel >= 0.30) {
      const score = Math.min(0.95, 0.55 + directionChanges * 0.15 + totalLateralTravel * 0.10);
      return score;
    }

    return 0;
  }

  /**
   * YES: Fist pose + vertical nodding bob
   */
  detectYesNod() {
    const n = this.history.length;
    if (n < 10) return 0;

    let fistCount = 0;
    for (let i = 0; i < n; i++) {
      if (this.history[i].isFist) fistCount++;
    }
    const fistRatio = fistCount / n;
    if (fistRatio < 0.55) return 0;

    const palmScale = this.history[n - 1].palmScale;
    const ys = this.history.map((h) => h.palmCenter.y / palmScale);
    const xs = this.history.map((h) => h.palmCenter.x / palmScale);

    let verticalChanges = 0;
    let lastVelY = 0;
    let totalVerticalTravel = 0;
    let totalHorizontalTravel = 0;
    const minStep = 0.025;

    for (let i = 1; i < n; i++) {
      const dy = ys[i] - ys[i - 1];
      const dx = xs[i] - xs[i - 1];
      totalVerticalTravel += Math.abs(dy);
      totalHorizontalTravel += Math.abs(dx);

      if (Math.abs(dy) > minStep) {
        const vel = Math.sign(dy);
        if (lastVelY !== 0 && vel !== lastVelY) {
          verticalChanges++;
        }
        lastVelY = vel;
      }
    }

    if (verticalChanges >= 1 && totalVerticalTravel >= 0.25) {
      const score = Math.min(0.95, 0.55 + verticalChanges * 0.15 + totalVerticalTravel * 0.10);
      return score;
    }

    return 0;
  }

  /**
   * NO: Index + Middle snapping shut or touching thumb
   */
  detectNoPinch() {
    const n = this.history.length;
    if (n < 6) return 0;

    const recent = this.history[n - 1];
    // Ring & Pinky must be curled
    if (recent.curl.ring > 0.68 || recent.curl.pinky > 0.68) return 0;

    const avgPinch = (recent.pinchDist + recent.pinchMiddleDist) / 2;

    // Direct pose: Index & Middle touching thumb
    if (avgPinch < 0.32) {
      // Check if there was open movement earlier
      let maxPinch = 0;
      for (let i = 0; i < n; i++) {
        const d = (this.history[i].pinchDist + this.history[i].pinchMiddleDist) / 2;
        if (d > maxPinch) maxPinch = d;
      }
      if (maxPinch > 0.38) {
        return 0.90; // Snap action detected
      }
      return 0.75; // Held closed pose
    }

    return 0;
  }

  /**
   * THANK YOU: Flat hand starting near chin/chest moving forward/downward
   */
  detectThankYouOutward() {
    const n = this.history.length;
    if (n < 8) return 0;

    const start = this.history[0];
    const end = this.history[n - 1];

    if (!end.isOpenPalm && end.curl.index < 0.65) return 0;

    const dy = (end.palmCenter.y - start.palmCenter.y) / end.palmScale;
    if (dy > 0.20 && start.palmCenter.y < 0.60) {
      return Math.min(0.90, 0.60 + dy * 0.4);
    }

    return 0;
  }

  /**
   * PLEASE: Flat palm tracing a circular path
   */
  detectPleaseCircular() {
    const n = this.history.length;
    if (n < 14) return 0;

    let openCount = 0;
    for (let i = 0; i < n; i++) {
      if (this.history[i].isOpenPalm) openCount++;
    }
    if (openCount / n < 0.55) return 0;

    return this.detectCircularPath(0.85);
  }

  /**
   * SORRY: Fist tracing a circular path
   */
  detectSorryCircular() {
    const n = this.history.length;
    if (n < 14) return 0;

    let fistCount = 0;
    for (let i = 0; i < n; i++) {
      if (this.history[i].isFist) fistCount++;
    }
    if (fistCount / n < 0.55) return 0;

    return this.detectCircularPath(0.85);
  }

  detectCircularPath(baseScore) {
    const n = this.history.length;
    const palmScale = this.history[n - 1].palmScale;

    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += this.history[i].palmCenter.x;
      sumY += this.history[i].palmCenter.y;
    }
    const cx = sumX / n;
    const cy = sumY / n;

    let totalAngleSwept = 0;
    let prevAngle = null;

    for (let i = 0; i < n; i++) {
      const dx = (this.history[i].palmCenter.x - cx) / palmScale;
      const dy = (this.history[i].palmCenter.y - cy) / palmScale;
      const angle = Math.atan2(dy, dx);

      if (prevAngle !== null) {
        let diff = angle - prevAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        totalAngleSwept += diff;
      }
      prevAngle = angle;
    }

    // Swept at least ~160 degrees (2.8 radians)
    if (Math.abs(totalAngleSwept) >= 2.8) {
      return Math.min(0.92, baseScore * (Math.abs(totalAngleSwept) / (2 * Math.PI)));
    }

    return 0;
  }
}

if (typeof window !== 'undefined') {
  window.GestureRecognizer = GestureRecognizer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GestureRecognizer };
}
