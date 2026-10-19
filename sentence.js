/**
 * SignBridge - Sentence & Composition Manager
 * Handles text composition, letter/word appending, editing, undo history,
 * word suggestions, and clipboard copying.
 */

class SentenceManager {
  constructor() {
    this.text = '';
    this.historyStack = []; // For undo operations
    this.onTextChange = null; // callback(text, suggestions)
    this.maxHistory = 50;

    // Common English words for predictive assistance while fingerspelling
    this.dictionary = [
      'HELLO', 'HELP', 'HOW', 'HERE', 'HAVE', 'HOME',
      'YES', 'YOU', 'YOUR',
      'NO', 'NAME', 'NICE', 'NEED', 'NOT',
      'THANK', 'THANKS', 'TIME', 'THERE', 'THIS', 'THAT',
      'PLEASE', 'PEOPLE',
      'SORRY', 'SEE', 'STOP', 'SIGN',
      'GOOD', 'GREAT', 'GO',
      'MORNING', 'MEET', 'MORE',
      'AFTERNOON', 'AGAIN', 'ALL',
      'WELCOME', 'WHERE', 'WHAT', 'WHO', 'WHY', 'WITH', 'WATER',
      'FRIEND', 'FAMILY', 'FEEL',
      'DEAF', 'DAY', 'DO',
      'CAN', 'COME',
      'LOVE', 'LIKE', 'LEARN',
      'WANT', 'WORK'
    ];
  }

  /**
   * Save current state for Undo
   */
  pushHistory() {
    this.historyStack.push(this.text);
    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    }
  }

  /**
   * Append a single confirmed letter
   * @param {string} letter
   */
  appendLetter(letter) {
    if (!letter) return;
    this.pushHistory();
    this.text += letter.toUpperCase();
    this.notify();
  }

  /**
   * Append a confirmed word (adds leading space if needed)
   * @param {string} word
   */
  appendWord(word) {
    if (!word) return;
    this.pushHistory();
    const cleanWord = word.trim().toUpperCase();

    if (this.text.length > 0 && !this.text.endsWith(' ')) {
      this.text += ' ' + cleanWord + ' ';
    } else {
      this.text += cleanWord + ' ';
    }
    this.notify();
  }

  /**
   * Insert a space character
   */
  addSpace() {
    if (this.text.length === 0 || this.text.endsWith(' ')) return;
    this.pushHistory();
    this.text += ' ';
    this.notify();
  }

  /**
   * Delete the last character or word
   */
  backspace() {
    if (this.text.length === 0) return;
    this.pushHistory();
    this.text = this.text.slice(0, -1);
    this.notify();
  }

  /**
   * Undo last modification
   */
  undo() {
    if (this.historyStack.length > 0) {
      this.text = this.historyStack.pop();
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Clear all composed text
   */
  clear() {
    if (this.text.length === 0) return;
    this.pushHistory();
    this.text = '';
    this.notify();
  }

  /**
   * Directly set text (e.g. from manual textarea edit or suggestion click)
   */
  setText(newText) {
    this.pushHistory();
    this.text = newText;
    this.notify();
  }

  /**
   * Get current composed text
   */
  getText() {
    return this.text;
  }

  /**
   * Copy current text to clipboard
   */
  async copyToClipboard() {
    if (!this.text || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(this.text.trim());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Compute word suggestions based on the current active word fragment
   */
  getSuggestions() {
    if (!this.text) return [];

    // Find the current trailing word token
    const lastSpaceIdx = this.text.lastIndexOf(' ');
    const currentFragment = (lastSpaceIdx === -1 ? this.text : this.text.slice(lastSpaceIdx + 1)).trim().toUpperCase();

    if (currentFragment.length < 2) return [];

    return this.dictionary
      .filter((w) => w.startsWith(currentFragment) && w !== currentFragment)
      .slice(0, 4);
  }

  /**
   * Accept a suggested word completion
   */
  acceptSuggestion(suggestedWord) {
    this.pushHistory();
    const lastSpaceIdx = this.text.lastIndexOf(' ');
    const prefix = lastSpaceIdx === -1 ? '' : this.text.slice(0, lastSpaceIdx + 1);
    this.text = prefix + suggestedWord.toUpperCase() + ' ';
    this.notify();
  }

  notify() {
    if (this.onTextChange) {
      this.onTextChange(this.text, this.getSuggestions());
    }
  }
}

if (typeof window !== 'undefined') {
  window.SentenceManager = SentenceManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SentenceManager };
}
