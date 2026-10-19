/**
 * Unit Test for SignBridge Geometric & Gesture Engines
 */
const assert = require('assert');

// Polyfill minimal browser globals for testing recognition classes in Node
global.performance = { now: () => Date.now() };

// Import modules
const { StaticAlphabetRecognizer } = require('../recognition.js');
const { GestureRecognizer } = require('../gesture-recognition.js');
const { SentenceManager } = require('../sentence.js');

console.log('Testing SentenceManager...');
const sm = new SentenceManager();
sm.appendLetter('H');
sm.appendLetter('E');
sm.appendLetter('L');
sm.appendLetter('P');
assert.strictEqual(sm.getText(), 'HELP', 'SentenceManager text should be HELP');
sm.addSpace();
sm.appendWord('ME');
assert.strictEqual(sm.getText(), 'HELP ME ', 'SentenceManager should append ME with space');
sm.backspace();
sm.undo();
console.log('✓ SentenceManager tests passed!');

console.log('Testing StaticAlphabetRecognizer...');
const rec = new StaticAlphabetRecognizer();

// Helper to generate a 21-landmark mock hand
function createMockHand(fingerState = {}) {
  // 0: wrist at (0.5, 0.8, 0)
  // 9: middle MCP at (0.5, 0.5, 0) => palmScale = 0.3
  const lm = [];
  for (let i = 0; i < 21; i++) {
    lm.push({ x: 0.5, y: 0.5, z: 0 });
  }
  lm[0] = { x: 0.5, y: 0.8, z: 0 }; // Wrist
  lm[5] = { x: 0.4, y: 0.52, z: 0 }; // Index MCP
  lm[9] = { x: 0.5, y: 0.50, z: 0 }; // Middle MCP
  lm[13] = { x: 0.58, y: 0.52, z: 0 }; // Ring MCP
  lm[17] = { x: 0.65, y: 0.55, z: 0 }; // Pinky MCP

  // Configure L sign mock:
  // Index straight up (tip 8 at y=0.15)
  // Thumb extended out (tip 4 at x=0.2, y=0.5)
  // Others curled (tips near MCPs)
  if (fingerState.sign === 'L') {
    // Thumb
    lm[1] = { x: 0.42, y: 0.68, z: 0 };
    lm[2] = { x: 0.35, y: 0.60, z: 0 };
    lm[3] = { x: 0.28, y: 0.55, z: 0 };
    lm[4] = { x: 0.20, y: 0.50, z: 0 }; // Thumb tip extended out

    // Index straight up
    lm[6] = { x: 0.4, y: 0.40, z: 0 };
    lm[7] = { x: 0.4, y: 0.28, z: 0 };
    lm[8] = { x: 0.4, y: 0.16, z: 0 }; // Index tip high

    // Middle, Ring, Pinky curled tight into palm (curling back towards MCP)
    lm[10] = { x: 0.5, y: 0.44, z: 0.04 };
    lm[11] = { x: 0.5, y: 0.48, z: 0.08 };
    lm[12] = { x: 0.5, y: 0.505, z: 0.04 }; // tip touches back near MCP

    lm[14] = { x: 0.58, y: 0.46, z: 0.04 };
    lm[15] = { x: 0.58, y: 0.50, z: 0.08 };
    lm[16] = { x: 0.58, y: 0.525, z: 0.04 };

    lm[18] = { x: 0.65, y: 0.49, z: 0.04 };
    lm[19] = { x: 0.65, y: 0.53, z: 0.08 };
    lm[20] = { x: 0.65, y: 0.555, z: 0.04 };
  }

  return lm;
}

const lHand = createMockHand({ sign: 'L' });
const lResult = rec.classify(lHand, 'Right');
console.log('L Sign Result:', lResult.candidate, 'Score:', Math.round(lResult.score * 100) + '%');
assert.strictEqual(lResult.candidate, 'L', 'Mock hand for L should classify as L');
console.log('✓ StaticAlphabetRecognizer classification passed!');

console.log('Testing GestureRecognizer...');
const gest = new GestureRecognizer();

// 1. Test stationary open hand rejection
let stationaryResult = null;
const openHand = [];
for (let i = 0; i < 21; i++) openHand.push({ x: 0.5, y: 0.5, z: 0 });
openHand[0] = { x: 0.5, y: 0.8, z: 0 };
openHand[5] = { x: 0.4, y: 0.5, z: 0 };
openHand[6] = { x: 0.4, y: 0.38, z: 0 };
openHand[7] = { x: 0.4, y: 0.26, z: 0 };
openHand[8] = { x: 0.4, y: 0.14, z: 0 };
openHand[9] = { x: 0.5, y: 0.5, z: 0 };
openHand[10] = { x: 0.5, y: 0.38, z: 0 };
openHand[11] = { x: 0.5, y: 0.26, z: 0 };
openHand[12] = { x: 0.5, y: 0.14, z: 0 };
openHand[13] = { x: 0.58, y: 0.5, z: 0 };
openHand[14] = { x: 0.58, y: 0.38, z: 0 };
openHand[15] = { x: 0.58, y: 0.26, z: 0 };
openHand[16] = { x: 0.58, y: 0.14, z: 0 };
openHand[17] = { x: 0.65, y: 0.5, z: 0 };
openHand[18] = { x: 0.65, y: 0.38, z: 0 };
openHand[19] = { x: 0.65, y: 0.26, z: 0 };
openHand[20] = { x: 0.65, y: 0.14, z: 0 };
openHand[1] = { x: 0.45, y: 0.7, z: 0 };
openHand[2] = { x: 0.38, y: 0.6, z: 0 };
openHand[3] = { x: 0.32, y: 0.5, z: 0 };
openHand[4] = { x: 0.25, y: 0.4, z: 0 };

for (let frame = 0; frame < 25; frame++) {
  stationaryResult = gest.classify(openHand, 'Right', frame * 33);
}
assert.strictEqual(stationaryResult.candidate, null, 'Stationary open hand must NOT trigger HELLO wave');
console.log('✓ Stationary hand properly rejected by GestureRecognizer!');

// 2. Test waving motion
let waveResult = null;
gest.resetHistory();
for (let frame = 0; frame < 30; frame++) {
  // Wave hand back and forth laterally: x oscillates
  const waveX = 0.5 + Math.sin(frame * 0.45) * 0.15;
  const wavingHand = openHand.map((p) => ({ ...p, x: p.x + (waveX - 0.5) }));
  waveResult = gest.classify(wavingHand, 'Right', frame * 33);
}
console.log('Waving Hand Result:', waveResult.candidate, 'Score:', Math.round(waveResult.score * 100) + '%');
assert.strictEqual(waveResult.candidate, 'HELLO', 'Waving hand should trigger HELLO');
console.log('✓ HELLO wave motion successfully detected!');

// 3. Test YES fist nod
gest.resetHistory();
const fistHand = [];
for (let i = 0; i < 21; i++) fistHand.push({ x: 0.5, y: 0.5, z: 0 });
fistHand[0] = { x: 0.5, y: 0.8, z: 0 };
fistHand[5] = { x: 0.4, y: 0.5, z: 0 };
fistHand[9] = { x: 0.5, y: 0.5, z: 0 };
fistHand[17] = { x: 0.65, y: 0.5, z: 0 };
// Curled fingers into palm
for (let f = 0; f < 4; f++) {
  const m = [5, 9, 13, 17][f];
  fistHand[m + 1] = { x: fistHand[m].x, y: 0.44, z: 0.04 };
  fistHand[m + 2] = { x: fistHand[m].x, y: 0.48, z: 0.08 };
  fistHand[m + 3] = { x: fistHand[m].x, y: 0.505, z: 0.04 };
}
fistHand[1] = { x: 0.45, y: 0.7, z: 0 };
fistHand[2] = { x: 0.38, y: 0.6, z: 0 };
fistHand[3] = { x: 0.42, y: 0.52, z: 0.06 };
fistHand[4] = { x: 0.45, y: 0.50, z: 0.08 }; // Thumb over fingers

let yesResult = null;
for (let frame = 0; frame < 30; frame++) {
  const dy = Math.sin(frame * 0.45) * 0.12; // vertical nod
  const noddingFist = fistHand.map((p) => ({ ...p, y: p.y + dy }));
  yesResult = gest.classify(noddingFist, 'Right', frame * 33);
}
console.log('Nodding Fist Result:', yesResult.candidate, 'Score:', Math.round(yesResult.score * 100) + '%');
assert.strictEqual(yesResult.candidate, 'YES', 'Nodding fist should trigger YES');
console.log('✓ YES fist nod successfully detected!');

console.log('\nAll core unit tests passed successfully!');

