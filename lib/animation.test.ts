import { describe, expect, it } from 'vitest';
import {
  easeInOutCubic,
  lerp,
  makeCursorSvg,
  pickTypingDelay,
  planMove,
  rand,
  sleep,
} from './animation';

// A deterministic RNG for tests. Each call returns the next value, then loops.
function seq(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

describe('rand', () => {
  it.each([
    { rngVal: 0, min: 0, max: 10, expected: 0 },
    { rngVal: 0.5, min: 0, max: 10, expected: 5 },
    { rngVal: 0.25, min: 100, max: 200, expected: 125 },
    { rngVal: 0.99, min: -1, max: 1, expected: 0.98 },
  ])('rand($min,$max) with rng=$rngVal => $expected', ({ rngVal, min, max, expected }) => {
    expect(rand(min, max, () => rngVal)).toBeCloseTo(expected, 6);
  });
});

describe('easeInOutCubic', () => {
  it.each([
    { t: 0, expected: 0 },
    { t: 0.5, expected: 0.5 },
    { t: 1, expected: 1 },
  ])('easeInOutCubic($t) === $expected at endpoints/midpoint', ({ t, expected }) => {
    expect(easeInOutCubic(t)).toBeCloseTo(expected, 6);
  });

  it('is monotonically non-decreasing on [0,1]', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = easeInOutCubic(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('lerp', () => {
  it('returns the start point at t=0', () => {
    expect(lerp({ x: 1, y: 2 }, { x: 9, y: 9 }, 0)).toEqual({ x: 1, y: 2 });
  });
  it('returns the end point at t=1', () => {
    expect(lerp({ x: 1, y: 2 }, { x: 9, y: 9 }, 1)).toEqual({ x: 9, y: 9 });
  });
  it('eases through the midpoint exactly halfway', () => {
    const m = lerp({ x: 0, y: 0 }, { x: 10, y: 100 }, 0.5);
    expect(m.x).toBeCloseTo(5, 6);
    expect(m.y).toBeCloseTo(50, 6);
  });
});

describe('planMove', () => {
  it('produces overshoot when rng[0] < 0.35', () => {
    // First rng controls overshoot decision; subsequent values feed jitter & sign picks.
    const rng = seq([0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    const plan = planMove({ x: 0, y: 0 }, { x: 100, y: 100 }, 700, rng);
    expect(plan.overshoot).not.toBeNull();
    expect(plan.framesPhase2).toBeGreaterThan(0);
  });

  it('skips overshoot when rng[0] >= 0.35', () => {
    const rng = seq([0.9, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    const plan = planMove({ x: 0, y: 0 }, { x: 100, y: 100 }, 700, rng);
    expect(plan.overshoot).toBeNull();
    expect(plan.framesPhase2).toBe(0);
  });

  it('produces one jitter offset per phase-1 frame', () => {
    const rng = seq([0.9, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    const plan = planMove({ x: 0, y: 0 }, { x: 100, y: 100 }, 700, rng);
    expect(plan.frameJitter).toHaveLength(plan.framesPhase1);
  });

  it('respects the minimum frame budget for short durations', () => {
    const rng = seq([0.9, 0.5, 0.5]);
    const plan = planMove({ x: 0, y: 0 }, { x: 1, y: 1 }, 50, rng);
    expect(plan.framesPhase1).toBeGreaterThanOrEqual(20);
  });
});

describe('pickTypingDelay', () => {
  it('always returns the space range for a space char', () => {
    const rng = seq([0.001, 0.5]);
    const d = pickTypingDelay(' ', rng);
    expect(d).toBeGreaterThanOrEqual(120);
    expect(d).toBeLessThan(220);
  });

  it('returns a long pause when rng[0] < 0.015', () => {
    const rng = seq([0.01, 0.5]);
    const d = pickTypingDelay('a', rng);
    expect(d).toBeGreaterThanOrEqual(400);
    expect(d).toBeLessThan(600);
  });

  it('returns a thinking pause when 0.015 <= rng[0] but rng[1] < 0.05', () => {
    const rng = seq([0.5, 0.01, 0.5]);
    const d = pickTypingDelay('a', rng);
    expect(d).toBeGreaterThanOrEqual(200);
    expect(d).toBeLessThan(350);
  });

  it('returns the baseline range otherwise', () => {
    const rng = seq([0.9, 0.9, 0.5]);
    const d = pickTypingDelay('a', rng);
    expect(d).toBeGreaterThanOrEqual(70);
    expect(d).toBeLessThan(130);
  });
});

describe('makeCursorSvg', () => {
  it('embeds the colors into the data URI', () => {
    const uri = makeCursorSvg('#ff00aa', 'white');
    expect(uri).toContain('url("data:image/svg+xml;utf8,');
    expect(decodeURIComponent(uri)).toContain("fill='#ff00aa'");
    expect(decodeURIComponent(uri)).toContain("stroke='white'");
  });
});

describe('sleep', () => {
  it('resolves after roughly the requested time', async () => {
    const start = Date.now();
    await sleep(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });
});
