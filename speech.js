/**
 * SignBridge - Speech Controller
 * Handles browser Text-to-Speech (TTS) synthesis and optional Speech-to-Text (STT) captioning.
 */

class SpeechController {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
    this.autoSpeak = false;

    // Speech Recognition (Optional STT)
    const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    this.recognition = SpeechRec ? new SpeechRec() : null;
    this.isListening = false;
    this.onSpeechResult = null; // callback(transcript)
    this.onListeningChange = null; // callback(isListening)

    this.initVoices();
    this.initRecognition();
  }

  /**
   * Populate available voices
   */
  initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      if (this.voices.length > 0 && !this.selectedVoice) {
        // Prefer natural English voices
        this.selectedVoice = this.voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Samantha'))) || this.voices[0];
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Speak arbitrary text using browser synthesis
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  speakText(text) {
    if (!this.synth || !text || text.trim().length === 0) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      // Cancel previous utterances to avoid queuing delay
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop any current speech playback
   */
  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Initialize browser SpeechRecognition for reverse captioning
   */
  initRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = (final || interim).trim();
      if (text && this.onSpeechResult) {
        this.onSpeechResult(text);
      }
    };

    this.recognition.onerror = (e) => {
      console.warn('SpeechRecognition error:', e);
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    };
  }

  /**
   * Toggle speech-to-text captions
   */
  toggleListening() {
    if (!this.recognition) {
      return { supported: false };
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
      return { supported: true, listening: false };
    } else {
      try {
        this.recognition.start();
        this.isListening = true;
        if (this.onListeningChange) this.onListeningChange(true);
        return { supported: true, listening: true };
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
        return { supported: true, listening: false, error: err };
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.SpeechController = SpeechController;
}
