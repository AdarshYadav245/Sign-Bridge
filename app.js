/**
 * SignBridge - Main Application Controller
 * Coordinates camera, landmark extraction, alphabet & gesture recognition engines,
 * hold-to-confirm temporal stabilization, UI updates, and speech interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('output-canvas');
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const btnFlipCamera = document.getElementById('btn-flip-camera');
  const btnToggleSkeleton = document.getElementById('btn-toggle-skeleton');
  const statusBadge = document.getElementById('status-badge');
  const candidateBadge = document.getElementById('candidate-badge');
  const candidateText = document.getElementById('candidate-text');
  const candidateScore = document.getElementById('candidate-score');
  const holdProgressRing = document.getElementById('hold-progress-fill');
  const holdProgressLabel = document.getElementById('hold-progress-label');

  // Mode Selection Elements
  const btnModeLetters = document.getElementById('btn-mode-letters');
  const btnModeWords = document.getElementById('btn-mode-words');
  const btnModeBoth = document.getElementById('btn-mode-both');
  const currentModeDisplay = document.getElementById('current-mode-display');

  // Text Composition Elements
  const textOutput = document.getElementById('text-output');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const btnAddSpace = document.getElementById('btn-add-space');
  const btnBackspace = document.getElementById('btn-backspace');
  const btnUndo = document.getElementById('btn-undo');
  const btnClear = document.getElementById('btn-clear');
  const btnCopy = document.getElementById('btn-copy');

  // Speech Elements
  const btnSpeak = document.getElementById('btn-speak');
  const chkAutoSpeak = document.getElementById('chk-auto-speak');
  const voiceSelect = document.getElementById('voice-select');
  const speedSlider = document.getElementById('speech-rate');
  const speedLabel = document.getElementById('speech-rate-label');
  const sensitivitySelect = document.getElementById('sensitivity-select');
  const btnToggleStt = document.getElementById('btn-toggle-stt');
  const sttCaptionBox = document.getElementById('stt-caption-box');
  const sttTranscript = document.getElementById('stt-transcript');

  // Reference Modal Elements
  const btnOpenRef = document.getElementById('btn-open-ref');
  const btnCloseRef = document.getElementById('btn-close-ref');
  const refModal = document.getElementById('reference-modal');
  const refTabs = document.querySelectorAll('.ref-tab-btn');
  const refTabPanels = document.querySelectorAll('.ref-tab-panel');

  // Core Subsystem Instances
  const cameraManager = new CameraManager(video);
  const landmarkTracker = new LandmarkTracker(canvas);
  const alphabetRecognizer = new StaticAlphabetRecognizer();
  const gestureRecognizer = new GestureRecognizer();
  const sentenceManager = new SentenceManager();
  const speechController = new SpeechController();
  const guidanceChart = new GuidanceChartManager();

  // Switch recognition mode automatically if practicing specific sign type
  guidanceChart.onPracticeSelect = (targetSign, type) => {
    if (type === 'word' && currentMode === 'letters') {
      setMode('both');
    } else if (type === 'letter' && currentMode === 'words') {
      setMode('both');
    }
  };

  // Direct 1-click tap to insert from the Guidance Chart
  guidanceChart.onSignInsert = (sign, type) => {
    if (type === 'word') {
      sentenceManager.appendWord(sign);
    } else {
      sentenceManager.appendLetter(sign);
    }
    playCommitChime(type === 'word');
    if (speechController.autoSpeak) {
      speechController.speakText(sign);
    }
    updateStatus(`Inserted: ${sign}!`, 'success');
    triggerCommitAnimation(sign);
  };

  // App State
  let currentMode = 'both'; // 'letters' | 'words' | 'both'
  let animationFrameId = null;

  // Temporal Hold-to-Confirm Stabilization State (Tuned for effortless signing)
  let pendingCandidate = null;
  let pendingType = null; // 'letter' | 'word'
  let pendingStartTime = 0;
  let lastCandidateSeenTime = 0;
  const GRACE_WINDOW_MS = 280;   // 280ms grace buffer preserves progress against camera flicker
  let letterHoldDurationMs = 360; // Snappy 360ms hold to commit letter
  let wordHoldDurationMs = 450;   // Snappy 450ms hold to commit word gesture
  let letterCooldownMs = 650;     // 650ms cooldown
  let wordCooldownMs = 1200;      // 1.2s cooldown
  let lastCommitTime = 0;
  let lastCommittedCandidate = null;

  // Audio confirmation beep synthesizer (using Web Audio API for snappy feedback)
  const audioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playCommitChime(isWord = false) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      osc.type = isWord ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isWord ? 587.33 : 523.25, now); // D5 or C5
      osc.frequency.exponentialRampToValueAtTime(isWord ? 880 : 659.25, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio autoplay policy or hardware muted
    }
  }

  // --- Initialize Landmark & Video Pipeline ---
  landmarkTracker.init().catch((err) => {
    console.error('MediaPipe Init Error:', err);
    updateStatus('Error loading MediaPipe AI model. Please check internet access.', 'error');
  });

  landmarkTracker.onLandmarksDetected = (landmarks, handedness) => {
    processRecognition(landmarks, handedness);
  };

  landmarkTracker.onNoHandsDetected = () => {
    const now = performance.now();
    if (now - lastCandidateSeenTime > GRACE_WINDOW_MS) {
      resetPendingHold();
      gestureRecognizer.resetHistory();
      updateCandidateUI(null, 0, 'No hand in frame');
      updateStatus('Searching for hand...', 'idle');
      guidanceChart.onCandidateDetected(null, 0, false);
    }
  };

  /**
   * Main frame recognition logic
   */
  function processRecognition(landmarks, handedness) {
    const now = performance.now();
    const timeSinceLastCommit = now - lastCommitTime;

    let candidate = null;
    let score = 0;
    let type = null; // 'letter' or 'word'
    let topAlt = null;

    // Evaluate based on active mode
    if (currentMode === 'words') {
      const gResult = gestureRecognizer.classify(landmarks, handedness, now);
      if (gResult.candidate && !gResult.inCooldown) {
        candidate = gResult.candidate;
        score = gResult.score;
        type = 'word';
      }
    } else if (currentMode === 'letters') {
      const aResult = alphabetRecognizer.classify(landmarks, handedness);
      if (aResult.candidate) {
        candidate = aResult.candidate;
        score = aResult.score;
        type = 'letter';
        if (aResult.topCandidates && aResult.topCandidates.length > 1) {
          topAlt = aResult.topCandidates[1];
        }
      }
    } else {
      // 'both' mode: Smart Arbitration
      const gResult = gestureRecognizer.classify(landmarks, handedness, now);
      if (gResult.candidate && !gResult.inCooldown) {
        candidate = gResult.candidate;
        score = gResult.score;
        type = 'word';
      } else {
        const aResult = alphabetRecognizer.classify(landmarks, handedness);
        if (aResult.candidate) {
          candidate = aResult.candidate;
          score = aResult.score;
          type = 'letter';
          if (aResult.topCandidates && aResult.topCandidates.length > 1) {
            topAlt = aResult.topCandidates[1];
          }
        }
      }
    }

    // Check cooldown state
    const currentCooldown = pendingType === 'word' ? wordCooldownMs : letterCooldownMs;
    const isCoolingDown = timeSinceLastCommit < currentCooldown;

    if (isCoolingDown) {
      updateCandidateUI(null, 0, 'Cooldown active');
      updateStatus('Cooldown: Ready shortly...', 'waiting');
      guidanceChart.onCandidateDetected(null, 0, false);
      return;
    }

    if (!candidate) {
      // Check grace window before resetting
      const elapsedSinceLastSeen = now - lastCandidateSeenTime;
      if (elapsedSinceLastSeen < GRACE_WINDOW_MS && pendingCandidate) {
        // In grace window: preserve hold progress
        updateStatus(`Hold steady for ${pendingCandidate}...`, 'holding');
        return;
      }

      resetPendingHold();
      updateCandidateUI(null, 0, 'Ready: Form a sign');
      updateStatus('Hand detected: Make a sign', 'active');
      guidanceChart.onCandidateDetected(null, 0, false);
      return;
    }

    // Candidate detected: Update last seen timestamp & UI
    lastCandidateSeenTime = now;
    const altHint = topAlt ? ` | Alt: ${topAlt.letter} (${Math.round(topAlt.score * 100)}%)` : '';
    updateCandidateUI(candidate, score, `Detected: ${candidate}${altHint}`);
    guidanceChart.onCandidateDetected(candidate, score, false);

    if (candidate === pendingCandidate && type === pendingType) {
      const elapsed = now - pendingStartTime;
      const targetDuration = type === 'word' ? wordHoldDurationMs : letterHoldDurationMs;
      const progress = Math.min(1.0, elapsed / targetDuration);

      updateHoldProgress(progress);

      if (progress >= 1.0) {
        // CONFIRMED! Commit candidate to composed text
        commitCandidate(candidate, type, now);
      } else {
        updateStatus(`Hold steady to confirm ${candidate}...`, 'holding');
      }
    } else {
      // New candidate started
      pendingCandidate = candidate;
      pendingType = type;
      pendingStartTime = now;
      updateHoldProgress(0.08);
      updateStatus(`Detected ${candidate}. Hold steady...`, 'holding');
    }
  }

  /**
   * Commit confirmed letter or word gesture
   */
  function commitCandidate(candidate, type, now) {
    lastCommitTime = now;
    lastCommittedCandidate = candidate;

    if (type === 'word') {
      sentenceManager.appendWord(candidate);
      gestureRecognizer.triggerCommit(candidate, now);
    } else {
      sentenceManager.appendLetter(candidate);
    }

    playCommitChime(type === 'word');
    guidanceChart.onCandidateDetected(candidate, 1.0, true);

    // Auto-speak if enabled
    if (speechController.autoSpeak) {
      speechController.speakText(candidate);
    }

    // Visual confirmation flash
    updateStatus(`Added: ${candidate}!`, 'success');
    resetPendingHold();
    triggerCommitAnimation(candidate);
  }

  function resetPendingHold() {
    pendingCandidate = null;
    pendingType = null;
    pendingStartTime = 0;
    updateHoldProgress(0);
  }

  // --- UI Update Helpers ---

  function updateStatus(text, state = 'idle') {
    statusBadge.textContent = text;
    statusBadge.className = `status-pill status-${state}`;
  }

  function updateCandidateUI(candidate, score, description) {
    if (candidate) {
      candidateBadge.classList.add('has-candidate');
      candidateText.textContent = candidate;
      candidateScore.textContent = `${Math.round(score * 100)}%`;
      holdProgressLabel.textContent = description || `Candidate: ${candidate}`;
    } else {
      candidateBadge.classList.remove('has-candidate');
      candidateText.textContent = '—';
      candidateScore.textContent = '';
      holdProgressLabel.textContent = description || 'Ready for sign';
    }
  }

  function updateHoldProgress(ratio) {
    const circumference = 2 * Math.PI * 44; // radius 44px
    const offset = circumference * (1 - ratio);
    if (holdProgressRing) {
      holdProgressRing.style.strokeDashoffset = offset;
    }
  }

  function triggerCommitAnimation(text) {
    candidateBadge.classList.add('committed-pulse');
    setTimeout(() => {
      candidateBadge.classList.remove('committed-pulse');
    }, 400);
  }

  // --- Camera Frame Loop ---

  async function frameLoop() {
    if (cameraManager.isActive) {
      await landmarkTracker.processFrame(video);
      animationFrameId = requestAnimationFrame(frameLoop);
    }
  }

  // --- Camera Controls ---

  btnToggleCamera.addEventListener('click', async () => {
    if (cameraManager.isActive) {
      await cameraManager.stop();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      btnToggleCamera.innerHTML = `<span class="icon">📷</span> Start Camera`;
      btnToggleCamera.classList.remove('btn-danger');
      btnToggleCamera.classList.add('btn-primary');
      updateStatus('Camera stopped', 'idle');
      updateCandidateUI(null, 0, 'Camera off');
      landmarkTracker.ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      try {
        updateStatus('Requesting webcam access...', 'waiting');
        await cameraManager.start();
        btnToggleCamera.innerHTML = `<span class="icon">⏹</span> Stop Camera`;
        btnToggleCamera.classList.remove('btn-primary');
        btnToggleCamera.classList.add('btn-danger');
        updateStatus('Camera running: Bring hand into view', 'active');
        frameLoop();
      } catch (err) {
        updateStatus(err.message, 'error');
        alert(err.message);
      }
    }
  });

  btnFlipCamera.addEventListener('click', () => {
    const newMirror = !cameraManager.isMirrored;
    cameraManager.setMirror(newMirror);
    landmarkTracker.setMirror(newMirror);
    btnFlipCamera.classList.toggle('active', newMirror);
  });

  btnToggleSkeleton.addEventListener('click', () => {
    const active = !landmarkTracker.showSkeleton;
    landmarkTracker.toggleSkeleton(active);
    btnToggleSkeleton.classList.toggle('active', active);
  });

  // --- Mode Switching ---

  function setMode(newMode) {
    currentMode = newMode;
    btnModeLetters.classList.toggle('active', newMode === 'letters');
    btnModeWords.classList.toggle('active', newMode === 'words');
    btnModeBoth.classList.toggle('active', newMode === 'both');

    const labels = {
      letters: 'A-Z Letters Mode',
      words: 'Word Gestures Mode (HELLO, YES, NO...)',
      both: 'Combined Mode (Smart Arbitration)'
    };
    currentModeDisplay.textContent = labels[newMode];
    resetPendingHold();
    gestureRecognizer.resetHistory();
  }

  btnModeLetters.addEventListener('click', () => setMode('letters'));
  btnModeWords.addEventListener('click', () => setMode('words'));
  btnModeBoth.addEventListener('click', () => setMode('both'));

  // --- Sentence & Text Composition ---

  sentenceManager.onTextChange = (text, suggestions) => {
    textOutput.value = text;
    renderSuggestions(suggestions);
  };

  textOutput.addEventListener('input', () => {
    sentenceManager.text = textOutput.value;
    renderSuggestions(sentenceManager.getSuggestions());
  });

  function renderSuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';
    if (!suggestions || suggestions.length === 0) return;

    suggestions.forEach((word) => {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.textContent = word;
      chip.title = `Click to complete with "${word}"`;
      chip.addEventListener('click', () => {
        sentenceManager.acceptSuggestion(word);
        if (speechController.autoSpeak) {
          speechController.speakText(word);
        }
      });
      suggestionsContainer.appendChild(chip);
    });
  }

  btnAddSpace.addEventListener('click', () => sentenceManager.addSpace());
  btnBackspace.addEventListener('click', () => sentenceManager.backspace());
  btnUndo.addEventListener('click', () => sentenceManager.undo());
  btnClear.addEventListener('click', () => sentenceManager.clear());

  btnCopy.addEventListener('click', async () => {
    const success = await sentenceManager.copyToClipboard();
    if (success) {
      const origText = btnCopy.innerHTML;
      btnCopy.innerHTML = `<span class="icon">✓</span> Copied!`;
      btnCopy.classList.add('btn-success');
      setTimeout(() => {
        btnCopy.innerHTML = origText;
        btnCopy.classList.remove('btn-success');
      }, 1500);
    }
  });

  // --- Speech Controls ---

  btnSpeak.addEventListener('click', () => {
    const text = sentenceManager.getText();
    if (text) {
      speechController.speakText(text);
    } else {
      updateStatus('Nothing composed to speak yet', 'waiting');
    }
  });

  chkAutoSpeak.addEventListener('change', (e) => {
    speechController.autoSpeak = e.target.checked;
  });

  speedSlider.addEventListener('input', (e) => {
    const rate = parseFloat(e.target.value);
    speechController.rate = rate;
    speedLabel.textContent = `${rate.toFixed(1)}x`;
  });

  function populateVoices() {
    const voices = speechController.voices;
    voiceSelect.innerHTML = '';
    voices.forEach((v, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${v.name} (${v.lang})`;
      if (v === speechController.selectedVoice) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
  }

  // Populate voices once speech synthesis loads them
  setTimeout(populateVoices, 500);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  voiceSelect.addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    speechController.selectedVoice = speechController.voices[idx];
  });

  if (sensitivitySelect) {
    sensitivitySelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      staticRecognizer.setSensitivity(mode);
      if (typeof gestureRecognizer.setSensitivity === 'function') {
        gestureRecognizer.setSensitivity(mode);
      }
    });
  }

  // Reverse Speech-to-Text Captions
  if (btnToggleStt) {
    btnToggleStt.addEventListener('click', () => {
      const res = speechController.toggleListening();
      if (!res.supported) {
        alert('Speech-to-text captions are not supported in this browser. Try Google Chrome or Edge.');
        return;
      }
      btnToggleStt.classList.toggle('active', res.listening);
      sttCaptionBox.classList.toggle('hidden', !res.listening);
      btnToggleStt.innerHTML = res.listening
        ? `<span class="icon">🎙️</span> Stop Captions`
        : `<span class="icon">🎤</span> Listen & Caption`;
    });

    speechController.onSpeechResult = (transcript) => {
      if (sttTranscript) {
        sttTranscript.textContent = transcript;
      }
    };
  }

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    // Only process if user is not manually typing inside the textarea
    if (document.activeElement === textOutput) return;

    if (e.code === 'Space') {
      e.preventDefault();
      sentenceManager.addSpace();
    } else if (e.code === 'Backspace') {
      e.preventDefault();
      sentenceManager.backspace();
    } else if (e.code === 'Enter') {
      e.preventDefault();
      speechController.speakText(sentenceManager.getText());
    } else if (e.code === 'Escape') {
      if (!refModal.classList.contains('hidden')) {
        refModal.classList.add('hidden');
      }
    }
  });

  // --- Reference Guide Modal ---
  if (btnOpenRef && btnCloseRef && refModal) {
    btnOpenRef.addEventListener('click', () => refModal.classList.remove('hidden'));
    btnCloseRef.addEventListener('click', () => refModal.classList.add('hidden'));
    refModal.addEventListener('click', (e) => {
      if (e.target === refModal) refModal.classList.add('hidden');
    });

    refTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        refTabs.forEach((t) => t.classList.remove('active'));
        refTabPanels.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPanel = document.getElementById(tab.dataset.target);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }
});
