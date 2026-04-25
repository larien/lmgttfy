// Pure helpers for the recipient walkthrough animation.
// All randomness flows through an injectable RNG so tests are deterministic.

export type Rng = () => number;

export const defaultRng: Rng = Math.random;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Returns a number in [min, max).
export function rand(min: number, max: number, rng: Rng = defaultRng): number {
  return rng() * (max - min) + min;
}

// Cubic ease-in-out matching the prototype.
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface Point {
  x: number;
  y: number;
}

export interface MovePlan {
  // Final landing point (with small target jitter applied).
  final: Point;
  // Optional overshoot waypoint reached before correcting back to `final`.
  overshoot: Point | null;
  // Per-frame jitter offsets (one entry per frame in phase 1).
  frameJitter: Point[];
  // Frame counts for each phase.
  framesPhase1: number;
  framesPhase2: number;
}

// Plans a single cursor move so the orchestrator can replay it frame-by-frame.
// Pure: given the same RNG, produces the same plan. Frame budget assumes 16ms.
export function planMove(
  from: Point,
  to: Point,
  durationMs: number,
  rng: Rng = defaultRng,
): MovePlan {
  const overshootChance = 0.35;
  const targetJitterRange = 2;
  const jitterRange = 0.4;
  const minPhase1Frames = 20;
  const minPhase2Frames = 8;
  const frameMs = 16;

  const willOvershoot = rng() < overshootChance;

  const final: Point = {
    x: to.x + rand(-targetJitterRange, targetJitterRange, rng),
    y: to.y + rand(-targetJitterRange, targetJitterRange, rng),
  };

  let overshoot: Point | null = null;
  if (willOvershoot) {
    const xSign = rng() < 0.5 ? -1 : 1;
    const ySign = rng() < 0.5 ? -1 : 1;
    overshoot = {
      x: final.x + xSign * rand(4, 10, rng),
      y: final.y + ySign * rand(2, 6, rng),
    };
  }

  const phase1Ms = willOvershoot ? durationMs * 0.85 : durationMs;
  const phase2Ms = willOvershoot ? durationMs * 0.15 : 0;
  const framesPhase1 = Math.max(minPhase1Frames, Math.floor(phase1Ms / frameMs));
  const framesPhase2 = willOvershoot
    ? Math.max(minPhase2Frames, Math.floor(phase2Ms / frameMs))
    : 0;

  const frameJitter: Point[] = [];
  for (let i = 0; i < framesPhase1; i++) {
    frameJitter.push({
      x: rand(-jitterRange, jitterRange, rng),
      y: rand(-jitterRange, jitterRange, rng),
    });
  }

  // Discard `from` and `to` from the result; the orchestrator already has them.
  void from;
  void to;

  return { final, overshoot, frameJitter, framesPhase1, framesPhase2 };
}

// Picks a typing delay matching the prototype's rhythm.
//   - 70-130ms baseline
//   - 5% chance: 200-350ms thinking pause
//   - 1.5% chance: 400-600ms longer pause
//   - spaces always 120-220ms (overrides the others)
export function pickTypingDelay(char: string, rng: Rng = defaultRng): number {
  if (char === ' ') return rand(120, 220, rng);
  if (rng() < 0.015) return rand(400, 600, rng);
  if (rng() < 0.05) return rand(200, 350, rng);
  return rand(70, 130, rng);
}

// Multiplier applied to per-char typing delays so long texts don't drag.
// Below TYPING_SHORT_LEN we keep the full natural rhythm — the joke reads
// as deliberate. Above TYPING_LONG_LEN we cap the speedup so it still
// looks like keystrokes, not a paste. Linear interpolation in between.
//
// Targets ~8s of typing at the 200-char validation cap (down from ~25s
// at the unscaled rhythm of ~124ms/char).
export const TYPING_SHORT_LEN = 30;
export const TYPING_LONG_LEN = 200;
export const TYPING_MIN_SCALE = 0.3;

export function typingSpeedScale(textLen: number): number {
  if (textLen <= TYPING_SHORT_LEN) return 1;
  if (textLen >= TYPING_LONG_LEN) return TYPING_MIN_SCALE;
  const t = (textLen - TYPING_SHORT_LEN) / (TYPING_LONG_LEN - TYPING_SHORT_LEN);
  return 1 - t * (1 - TYPING_MIN_SCALE);
}

// Builds the cursor SVG as a data URI. Colors come from the theme's
// computed --cursor-color and --cursor-stroke variables, so the orchestrator
// reads `getComputedStyle` and passes them in.
export function makeCursorSvg(color: string, stroke: string): string {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 24'>" +
    `<path d='M2 2 L2 18 L6 14 L9 21 L11 20 L8 13 L14 13 Z' ` +
    `fill='${color}' stroke='${stroke}' stroke-width='1.2' stroke-linejoin='round'/>` +
    '</svg>';
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// Linear interpolation between two points along an eased t in [0, 1].
export function lerp(a: Point, b: Point, t: number): Point {
  const e = easeInOutCubic(t);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
}
