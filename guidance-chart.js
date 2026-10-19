/**
 * SignBridge - Interactive Visual Guidance Chart & Practice Coach
 * Provides real-time guidance handbook for static A-Z fingerspelling and dynamic word gestures,
 * interactive practice coach mode with live camera feedback, and search filtering.
 */

class GuidanceChartManager {
  constructor() {
    this.lettersGrid = document.getElementById('letters-chart-grid');
    this.wordsGrid = document.getElementById('words-chart-grid');
    this.searchInput = document.getElementById('guidance-search');
    this.tabBtnLetters = document.getElementById('tab-btn-letters');
    this.tabBtnWords = document.getElementById('tab-btn-words');
    this.viewLetters = document.getElementById('guidance-view-letters');
    this.viewWords = document.getElementById('guidance-view-words');

    // Coach Banner Elements
    this.coachBanner = document.getElementById('coach-banner');
    this.coachTargetName = document.getElementById('coach-target-name');
    this.coachTargetHint = document.getElementById('coach-target-hint');
    this.coachMatchStatus = document.getElementById('coach-match-status');
    this.btnCloseCoach = document.getElementById('btn-close-coach');

    this.activeTab = 'letters';
    this.practiceTarget = null;
    this.onPracticeSelect = null; // callback(targetSign, type)

    // Complete Guidance Dataset for Letters (A-Z)
    this.lettersData = [
      {
        sign: 'A',
        name: 'Letter A',
        pose: 'Closed Fist',
        rule: 'Thumb rests upright alongside the index finger knuckle.',
        tip: 'Keep thumb upright on side; do not wrap thumb over curled fingers.',
        keywords: 'fist thumb up side vertical'
      },
      {
        sign: 'B',
        name: 'Letter B',
        pose: 'Flat Palm Up',
        rule: 'Four fingers straight up touching together, thumb folded across palm.',
        tip: 'Ensure all 4 fingers are straight and touching; thumb rests on palm.',
        keywords: 'flat open four fingers palm folded'
      },
      {
        sign: 'C',
        name: 'Letter C',
        pose: 'C-Curve Arc',
        rule: 'All fingers curved smoothly with thumb opposed to form a C.',
        tip: 'Keep the space between thumb and index open like a cup.',
        keywords: 'curve arc cup half circle'
      },
      {
        sign: 'D',
        name: 'Letter D',
        pose: 'Pointing Up Loop',
        rule: 'Index finger straight up; thumb touches middle and ring tips forming an O.',
        tip: 'Only index points straight up; other 3 fingers touch thumb tip.',
        keywords: 'index point loop o circle'
      },
      {
        sign: 'E',
        name: 'Letter E',
        pose: 'Curled Claw',
        rule: 'All 4 fingers curled down tightly, resting on top of folded thumb.',
        tip: 'Fingertips tuck tightly down against the thumb horizontal base.',
        keywords: 'curled claw nails tucked thumb'
      },
      {
        sign: 'F',
        name: 'Letter F',
        pose: 'OK Loop Sign',
        rule: 'Thumb tip and index tip touch in a circle; middle, ring, pinky straight up.',
        tip: 'Spread the three upright fingers slightly apart.',
        keywords: 'ok circle loop three up spread'
      },
      {
        sign: 'G',
        name: 'Letter G',
        pose: 'Horizontal Point',
        rule: 'Index finger pointing horizontally sideways, thumb parallel, others curled.',
        tip: 'Turn hand sideways so index and thumb point horizontally.',
        keywords: 'sideways horizontal point parallel'
      },
      {
        sign: 'H',
        name: 'Letter H',
        pose: 'Two Fingers Sideways',
        rule: 'Index and middle fingers pointing horizontally together, others curled.',
        tip: 'Keep index and middle touching horizontally.',
        keywords: 'two sideways horizontal index middle'
      },
      {
        sign: 'I',
        name: 'Letter I',
        pose: 'Pinky Up',
        rule: 'Pinky finger straight up, other fingers curled in tight fist, thumb across.',
        tip: 'Only pinky is extended; thumb folds over curled fingers.',
        keywords: 'pinky little finger up fist'
      },
      {
        sign: 'K',
        name: 'Letter K',
        pose: 'V with Knuckle Thumb',
        rule: 'Index straight up, middle finger angled forward/up, thumb touches middle PIP.',
        tip: 'Rest thumb tip right between index and middle knuckles.',
        keywords: 'peace knuckle middle forward pip'
      },
      {
        sign: 'L',
        name: 'Letter L',
        pose: 'L-Shape Angle',
        rule: 'Index finger points straight up, thumb extends outward at 90° angle.',
        tip: 'Forms an unmistakable "L" between index and thumb.',
        keywords: 'l shape ninety angle corner thumb index'
      },
      {
        sign: 'M',
        name: 'Letter M',
        pose: 'Three Fingers Over',
        rule: 'Index, middle, and ring fingers folded over the tucked thumb.',
        tip: 'Thumb tip peeks out between ring finger and pinky finger.',
        keywords: 'three over thumb drape m'
      },
      {
        sign: 'N',
        name: 'Letter N',
        pose: 'Two Fingers Over',
        rule: 'Index and middle fingers folded over the tucked thumb.',
        tip: 'Thumb tip peeks out between middle finger and ring finger.',
        keywords: 'two over thumb drape n'
      },
      {
        sign: 'O',
        name: 'Letter O',
        pose: 'O-Loop Oval',
        rule: 'All fingertips touch thumb tip forming a circular O ring.',
        tip: 'Form a round, hollow O shape with curved fingers.',
        keywords: 'o loop circle oval round'
      },
      {
        sign: 'P',
        name: 'Letter P',
        pose: 'Downward K',
        rule: '\'K\' hand shape with wrist tilted downward toward floor.',
        tip: 'Angle your wrist downward so index finger points toward the ground.',
        keywords: 'downward floor invert k'
      },
      {
        sign: 'Q',
        name: 'Letter Q',
        pose: 'Downward G',
        rule: '\'G\' hand shape (index and thumb) pointing downward toward floor.',
        tip: 'Tilt wrist downward so index points toward the floor.',
        keywords: 'downward floor invert g'
      },
      {
        sign: 'R',
        name: 'Letter R',
        pose: 'Crossed Fingers',
        rule: 'Index and middle fingers extended upright and crossed over each other.',
        tip: 'Cross index finger over the middle finger like wishing good luck.',
        keywords: 'cross crossed luck overlap'
      },
      {
        sign: 'S',
        name: 'Letter S',
        pose: 'Thumb-Front Fist',
        rule: 'Fist with thumb folded horizontally across the FRONT of curled fingers.',
        tip: 'Wrap thumb over front of fingers (differs from A where thumb is on side).',
        keywords: 'fist thumb front over wrap'
      },
      {
        sign: 'T',
        name: 'Letter T',
        pose: 'Thumb-Tuck Fist',
        rule: 'Fist with thumb tucked between index and middle fingers.',
        tip: 'Thumb pokes up under index finger knuckle.',
        keywords: 'thumb tuck between index middle'
      },
      {
        sign: 'U',
        name: 'Letter U',
        pose: 'Fingers Together Up',
        rule: 'Index and middle fingers straight up and squeezed tightly together.',
        tip: 'Keep index and middle touching; do not spread apart.',
        keywords: 'together touch pair index middle'
      },
      {
        sign: 'V',
        name: 'Letter V',
        pose: 'Peace / V-Sign',
        rule: 'Index and middle fingers straight up and spread apart in a \'V\'.',
        tip: 'Spread index and middle at least 2 inches apart.',
        keywords: 'peace v spread apart two victory'
      },
      {
        sign: 'W',
        name: 'Letter W',
        pose: 'Three Fingers Spread',
        rule: 'Index, middle, and ring fingers straight up and spread apart in a W.',
        tip: 'Thumb holds pinky tip down across palm.',
        keywords: 'three spread w fingers up'
      },
      {
        sign: 'X',
        name: 'Letter X',
        pose: 'Hook / Trigger',
        rule: 'Index finger hooked/bent like a trigger, other fingers curled in fist.',
        tip: 'Bend index at middle joint like a pirate hook.',
        keywords: 'hook bent trigger pirate'
      },
      {
        sign: 'Y',
        name: 'Letter Y',
        pose: 'Shaka / Hang Loose',
        rule: 'Thumb and pinky extended out sideways, middle 3 curled in fist.',
        tip: 'Extend thumb and pinky widely like a phone or surf shaka.',
        keywords: 'shaka phone surf hang loose thumb pinky'
      }
    ];

    // Complete Guidance Dataset for Word Gestures (Animated GIFs)
    this.wordsData = [
      {
        sign: 'HELLO',
        name: 'HELLO',
        icon: 'assets/gestures/hello.gif',
        motionType: 'Lateral Wave',
        rule: 'Hold open palm facing the webcam and wave side-to-side 2 to 3 times.',
        tip: 'Requires dynamic lateral oscillation. A stationary open palm is intentionally rejected.',
        keywords: 'wave greeting hi hello palm lateral'
      },
      {
        sign: 'YES',
        name: 'YES',
        icon: 'assets/gestures/yes.gif',
        motionType: 'Vertical Nod',
        rule: 'Make an \'S\' fist and bob it up and down vertically like nodding yes.',
        tip: 'Bob up and down 2–3 times. Horizontal shaking is rejected.',
        keywords: 'nod yes agree fist bob vertical'
      },
      {
        sign: 'NO',
        name: 'NO',
        icon: 'assets/gestures/no.gif',
        motionType: 'Pinch Snap',
        rule: 'Extend index and middle fingers together, then snap them shut to the thumb twice.',
        tip: 'Quick snapping motion mimics a duck bill or beak snapping closed.',
        keywords: 'no disagree snap pinch close duck bill'
      },
      {
        sign: 'THANK YOU',
        name: 'THANK YOU',
        icon: 'assets/gestures/thank-you.gif',
        motionType: 'Outward Path',
        rule: 'Start with flat open hand near chin/upper chest, then move forward/downward toward camera.',
        tip: 'Motion flows naturally outward toward your conversational partner.',
        keywords: 'thanks thank you grateful chin outward forward'
      },
      {
        sign: 'PLEASE',
        name: 'PLEASE',
        icon: 'assets/gestures/please.gif',
        motionType: 'Chest Circle',
        rule: 'Flat open palm rubbing in a smooth circular path over your chest area.',
        tip: 'Complete at least one full circular motion over the chest.',
        keywords: 'please polite circle chest open palm'
      },
      {
        sign: 'SORRY',
        name: 'SORRY',
        icon: 'assets/gestures/sorry.gif',
        motionType: 'Fist Circle',
        rule: 'Closed \'A\' or \'S\' fist rubbing in a circular path over your chest area.',
        tip: 'Keep hand tightly in a fist while circling over the chest.',
        keywords: 'sorry apologize fist circle chest regret'
      }
    ];

    this.init();
  }

  init() {
    this.renderLetters();
    this.renderWords();
    this.attachEventListeners();
  }

  /**
   * Render Alphabet Cards Grid
   */
  renderLetters(filterText = '') {
    if (!this.lettersGrid) return;
    this.lettersGrid.innerHTML = '';

    const query = filterText.trim().toLowerCase();
    const filtered = this.lettersData.filter((item) => {
      if (!query) return true;
      return item.sign.toLowerCase().includes(query) ||
             item.name.toLowerCase().includes(query) ||
             item.pose.toLowerCase().includes(query) ||
             item.rule.toLowerCase().includes(query) ||
             item.keywords.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      this.lettersGrid.innerHTML = `<div class="guidance-no-results">No letters matching "${filterText}". Try "fist", "thumb", "index", or a letter.</div>`;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'chart-card letter-chart-card';
      card.dataset.sign = item.sign;
      card.dataset.type = 'letter';

      card.innerHTML = `
        <div class="card-sign-badge">${item.sign}</div>
        <div class="card-pose-label">${item.pose}</div>
        <div class="card-instruction">${item.rule}</div>
        <div class="card-tip"><strong>Tip:</strong> ${item.tip}</div>
        <div class="card-actions-row">
          <button class="btn-practice-chip" title="Practice sign ${item.sign}">
            <span class="chip-icon">🎯</span> Practice
          </button>
          <button class="btn-insert-chip" title="Directly insert '${item.sign}' into text">
            <span class="chip-icon">➕</span> Insert
          </button>
        </div>
      `;

      card.querySelector('.btn-practice-chip').addEventListener('click', (e) => {
        e.stopPropagation();
        this.startPractice(item.sign, 'letter', item.rule);
      });

      card.querySelector('.btn-insert-chip').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onSignInsert) this.onSignInsert(item.sign, 'letter');
      });

      card.addEventListener('click', () => {
        this.startPractice(item.sign, 'letter', item.rule);
      });

      this.lettersGrid.appendChild(card);
    });
  }

  /**
   * Render Word Gestures Cards Grid
   */
  renderWords(filterText = '') {
    if (!this.wordsGrid) return;
    this.wordsGrid.innerHTML = '';

    const query = filterText.trim().toLowerCase();
    const filtered = this.wordsData.filter((item) => {
      if (!query) return true;
      return item.sign.toLowerCase().includes(query) ||
             item.motionType.toLowerCase().includes(query) ||
             item.rule.toLowerCase().includes(query) ||
             item.keywords.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      this.wordsGrid.innerHTML = `<div class="guidance-no-results">No gestures matching "${filterText}". Try "wave", "nod", or "snap".</div>`;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'chart-card word-chart-card';
      card.dataset.sign = item.sign;
      card.dataset.type = 'word';

      card.innerHTML = `
        <div class="word-card-top">
          <img src="${item.icon}" alt="${item.sign} animated motion gesture" class="word-card-vector word-card-gif">
          <div class="word-card-meta">
            <div class="word-sign-badge">${item.sign}</div>
            <span class="motion-type-pill">${item.motionType}</span>
          </div>
        </div>
        <div class="card-instruction">${item.rule}</div>
        <div class="card-tip"><strong>Accuracy Note:</strong> ${item.tip}</div>
        <div class="card-actions-row">
          <button class="btn-practice-chip btn-practice-word" title="Practice gesture ${item.sign}">
            <span class="chip-icon">🎯</span> Practice
          </button>
          <button class="btn-insert-chip btn-insert-word" title="Directly insert '${item.sign}' into text">
            <span class="chip-icon">➕</span> Insert
          </button>
        </div>
      `;

      card.querySelector('.btn-practice-chip').addEventListener('click', (e) => {
        e.stopPropagation();
        this.startPractice(item.sign, 'word', item.rule);
      });

      card.querySelector('.btn-insert-chip').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onSignInsert) this.onSignInsert(item.sign, 'word');
      });

      card.addEventListener('click', () => {
        this.startPractice(item.sign, 'word', item.rule);
      });

      this.wordsGrid.appendChild(card);
    });
  }

  attachEventListeners() {
    // Tab switching
    if (this.tabBtnLetters && this.tabBtnWords) {
      this.tabBtnLetters.addEventListener('click', () => this.switchTab('letters'));
      this.tabBtnWords.addEventListener('click', () => this.switchTab('words'));
    }

    // Search filter
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (this.activeTab === 'letters') {
          this.renderLetters(val);
        } else {
          this.renderWords(val);
        }
      });
    }

    // Close coach button
    if (this.btnCloseCoach) {
      this.btnCloseCoach.addEventListener('click', () => this.stopPractice());
    }

    // Lightbox Zoom for ASL Alphabet Image Chart
    const btnZoom = document.getElementById('btn-zoom-chart');
    const chartPreview = document.getElementById('chart-preview-box');
    const lightbox = document.getElementById('chart-lightbox-modal');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');
    const aslChartImg = document.getElementById('asl-chart-img');
    const lightboxImg = document.getElementById('lightbox-img');

    const openLightbox = () => {
      if (lightbox && aslChartImg && lightboxImg) {
        lightboxImg.src = aslChartImg.src;
        lightbox.classList.remove('hidden');
      }
    };

    if (btnZoom) btnZoom.addEventListener('click', openLightbox);
    if (chartPreview) chartPreview.addEventListener('click', openLightbox);

    if (btnCloseLightbox && lightbox) {
      btnCloseLightbox.addEventListener('click', () => lightbox.classList.add('hidden'));
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.add('hidden');
      });
    }

    // Custom Chart Image Upload
    const fileUpload = document.getElementById('chart-image-upload');
    if (fileUpload && aslChartImg) {
      fileUpload.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            aslChartImg.src = loadEvt.target.result;
            if (lightboxImg) lightboxImg.src = loadEvt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.tabBtnLetters.classList.toggle('active', tab === 'letters');
    this.tabBtnWords.classList.toggle('active', tab === 'words');
    this.viewLetters.classList.toggle('active', tab === 'letters');
    this.viewWords.classList.toggle('active', tab === 'words');

    const searchVal = this.searchInput ? this.searchInput.value : '';
    if (tab === 'letters') {
      this.renderLetters(searchVal);
    } else {
      this.renderWords(searchVal);
    }
  }

  /**
   * Activate interactive coach practice mode
   */
  startPractice(signName, type, hint) {
    this.practiceTarget = signName;
    if (this.coachBanner) {
      this.coachBanner.classList.remove('hidden');
      this.coachTargetName.textContent = signName;
      this.coachTargetHint.textContent = hint;
      this.coachMatchStatus.textContent = 'Awaiting sign...';
      this.coachMatchStatus.className = 'coach-status-pill status-awaiting';
    }

    // Highlight card in chart
    document.querySelectorAll('.chart-card').forEach((c) => {
      c.classList.toggle('card-in-practice', c.dataset.sign === signName);
    });

    if (this.onPracticeSelect) {
      this.onPracticeSelect(signName, type);
    }
  }

  /**
   * Stop practice coach
   */
  stopPractice() {
    this.practiceTarget = null;
    if (this.coachBanner) {
      this.coachBanner.classList.add('hidden');
    }
    document.querySelectorAll('.chart-card').forEach((c) => {
      c.classList.remove('card-in-practice');
    });
  }

  /**
   * Real-time sync callback: update coach feedback and highlight detected card
   */
  onCandidateDetected(candidate, score, isConfirmed = false) {
    if (!candidate) {
      if (this.coachBanner && this.practiceTarget) {
        this.coachMatchStatus.textContent = `Awaiting ${this.practiceTarget}...`;
        this.coachMatchStatus.className = 'coach-status-pill status-awaiting';
      }
      return;
    }

    // Highlight detected card in guidance chart
    const activeCard = document.querySelector(`.chart-card[data-sign="${candidate}"]`);
    if (activeCard) {
      activeCard.classList.add('detected-live');
      setTimeout(() => activeCard.classList.remove('detected-live'), 400);
    }

    // Coach status evaluation
    if (this.coachBanner && this.practiceTarget) {
      if (candidate === this.practiceTarget) {
        if (isConfirmed) {
          this.coachMatchStatus.textContent = `🎉 Confirmed: ${candidate}!`;
          this.coachMatchStatus.className = 'coach-status-pill status-confirmed';
        } else {
          this.coachMatchStatus.textContent = `✓ Great Match (${Math.round(score * 100)}%)! Hold steady...`;
          this.coachMatchStatus.className = 'coach-status-pill status-matched';
        }
      } else {
        this.coachMatchStatus.textContent = `Detected ${candidate} (target is ${this.practiceTarget})`;
        this.coachMatchStatus.className = 'coach-status-pill status-mismatch';
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.GuidanceChartManager = GuidanceChartManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GuidanceChartManager };
}
