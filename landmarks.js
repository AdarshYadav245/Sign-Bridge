/**
 * SignBridge - Landmark Extractor & Canvas Overlay
 * Initializes MediaPipe Hands, extracts 21 3D coordinates, and renders glowing assistive overlays.
 */

class LandmarkTracker {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.hands = null;
    this.isReady = false;
    this.isMirrored = true;
    this.showSkeleton = true;
    this.showBoundingBox = true;
    this.onLandmarksDetected = null; // callback(landmarks, handedness, rawResults)
    this.onNoHandsDetected = null;

    // Bone connection topology for MediaPipe 21 landmarks
    this.connections = [
      // Palm base
      [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
      // Thumb
      [1, 2], [2, 3], [3, 4],
      // Index
      [5, 6], [6, 7], [7, 8],
      // Middle
      [9, 10], [10, 11], [11, 12],
      // Ring
      [13, 14], [14, 15], [15, 16],
      // Pinky
      [17, 18], [18, 19], [19, 20]
    ];

    this.fingertipIndices = [4, 8, 12, 16, 20];
  }

  /**
   * Initialize MediaPipe Hands model from CDN
   */
  async init() {
    if (typeof Hands === 'undefined') {
      throw new Error('MediaPipe Hands library not loaded. Check internet connection or CDN script tags.');
    }

    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1, // Single-hand focused for maximum accuracy and speed
      modelComplexity: 1, // 1 = High Accuracy
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    this.hands.onResults((results) => this.handleResults(results));
    this.isReady = true;
    return true;
  }

  /**
   * Send frame from video element to MediaPipe
   */
  async processFrame(videoElement) {
    if (!this.isReady || !this.hands || !videoElement || videoElement.readyState < 2) {
      return;
    }

    // Match canvas dimensions to video aspect
    if (this.canvas.width !== videoElement.videoWidth || this.canvas.height !== videoElement.videoHeight) {
      this.canvas.width = videoElement.videoWidth || 640;
      this.canvas.height = videoElement.videoHeight || 480;
    }

    await this.hands.send({ image: videoElement });
  }

  /**
   * Handle prediction results from MediaPipe
   */
  handleResults(results) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Clear previous drawing
    ctx.clearRect(0, 0, width, height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      if (this.onNoHandsDetected) {
        this.onNoHandsDetected();
      }
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness && results.multiHandedness[0]
      ? results.multiHandedness[0].label
      : 'Right';

    // Render skeleton & overlay if enabled
    if (this.showSkeleton) {
      this.drawHandOverlay(landmarks, handedness, width, height);
    }

    // Notify listeners with landmark array
    if (this.onLandmarksDetected) {
      this.onLandmarksDetected(landmarks, handedness, results);
    }
  }

  /**
   * Draw glowing neon assistive overlay on canvas
   */
  drawHandOverlay(landmarks, handedness, width, height) {
    const ctx = this.ctx;
    ctx.save();

    // If mirrored, flip context to align with mirrored webcam
    if (this.isMirrored) {
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
    }

    // Convert normalized landmarks to pixel coords
    const points = landmarks.map((lm) => ({
      x: lm.x * width,
      y: lm.y * height,
      z: lm.z
    }));

    // Calculate bounding box
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const pad = 24;
    minX = Math.max(0, minX - pad);
    maxX = Math.min(width, maxX + pad);
    minY = Math.max(0, minY - pad);
    maxY = Math.min(height, maxY + pad);

    // Draw tech corner brackets for bounding box
    if (this.showBoundingBox) {
      this.drawCornerBrackets(ctx, minX, minY, maxX - minX, maxY - minY);
    }

    // Draw bone connections
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)'; // Electric sky blue
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    this.connections.forEach(([startIdx, endIdx]) => {
      const p1 = points[startIdx];
      const p2 = points[endIdx];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw joints
    points.forEach((p, idx) => {
      const isFingertip = this.fingertipIndices.includes(idx);
      const isWrist = idx === 0;

      ctx.beginPath();
      if (isFingertip) {
        // Glowing fingertip circle
        ctx.arc(p.x, p.y, 6.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#f43f5e'; // Vibrant rose
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else if (isWrist) {
        ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#10b981'; // Emerald green
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else {
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }

  /**
   * Draw high-tech HUD corner brackets
   */
  drawCornerBrackets(ctx, x, y, w, h) {
    const len = Math.min(22, w * 0.2, h * 0.2);
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + len);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + len, y + h);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - len);
    ctx.stroke();

    ctx.restore();
  }

  setMirror(enabled) {
    this.isMirrored = enabled;
  }

  toggleSkeleton(enabled) {
    this.showSkeleton = enabled;
  }
}

if (typeof window !== 'undefined') {
  window.LandmarkTracker = LandmarkTracker;
}
