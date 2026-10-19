/**
 * SignBridge - Camera Manager
 * Manages webcam lifecycle, media streams, error handling, and video track constraints.
 */

class CameraManager {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
    this.isActive = false;
    this.isMirrored = true;
    this.selectedDeviceId = null;
    this.onStatusChange = null;
    this.onError = null;
  }

  /**
   * Request webcam access and start the video feed
   * @param {string|null} deviceId - Specific device ID or null for default
   */
  async start(deviceId = null) {
    if (this.isActive) {
      await this.stop();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('Camera API (getUserMedia) is not supported by your browser.');
      if (this.onError) this.onError(err);
      throw err;
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: 'user'
      }
    };

    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
      this.selectedDeviceId = deviceId;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      this.videoElement.style.transform = this.isMirrored ? 'scaleX(-1)' : 'none';

      await new Promise((resolve, reject) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play().then(resolve).catch(reject);
        };
        this.videoElement.onerror = (e) => reject(e);
      });

      this.isActive = true;
      if (this.onStatusChange) {
        this.onStatusChange({ active: true, width: this.videoElement.videoWidth, height: this.videoElement.videoHeight });
      }

      return true;
    } catch (err) {
      this.isActive = false;
      let userFriendlyMessage = 'Unable to access the camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMessage = 'Camera permission was denied. Please allow camera access in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userFriendlyMessage = 'Camera is already in use by another application or tab.';
      } else if (err.name === 'OverconstrainedError') {
        userFriendlyMessage = 'Camera does not satisfy the resolution constraints. Retrying with basic constraints...';
        // Fallback retry with minimal constraints
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          this.videoElement.srcObject = this.stream;
          await this.videoElement.play();
          this.isActive = true;
          if (this.onStatusChange) this.onStatusChange({ active: true });
          return true;
        } catch (fallbackErr) {
          userFriendlyMessage = 'Fallback camera initialization also failed: ' + fallbackErr.message;
        }
      }

      const enhancedError = new Error(userFriendlyMessage);
      enhancedError.original = err;
      if (this.onError) this.onError(enhancedError);
      throw enhancedError;
    }
  }

  /**
   * Stop video stream and release hardware camera lock
   */
  async stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.isActive = false;
    if (this.onStatusChange) {
      this.onStatusChange({ active: false });
    }
  }

  /**
   * Toggle video mirroring (horizontal flip)
   */
  setMirror(enabled) {
    this.isMirrored = enabled;
    if (this.videoElement) {
      this.videoElement.style.transform = enabled ? 'scaleX(-1)' : 'none';
    }
  }

  /**
   * List available camera devices
   */
  async getAvailableCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }
}

// Export for ES modules and global script availability
if (typeof window !== 'undefined') {
  window.CameraManager = CameraManager;
}
