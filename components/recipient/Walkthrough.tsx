'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LANGUAGES,
  LANG_CODES,
  SRC_AUTO_LABEL,
  type LangCode,
  type SrcLangCode,
} from '@/lib/languages';
import { THEMES, type Theme } from '@/lib/themes';
import {
  buildGoogleTranslateUrl,
  parseRecipientUrl,
  type RecipientUrlParts,
} from '@/lib/url';
import {
  lerp,
  makeCursorSvg,
  pickTypingDelay,
  planMove,
  rand,
  sleep,
  type Point,
} from '@/lib/animation';
import type { ValidationError } from '@/lib/validation';
import { ErrorWalkthrough } from './ErrorWalkthrough';
import { ParodyBanner } from './ParodyBanner';
import { RevealScreen } from './RevealScreen';
import { SkipButton } from './SkipButton';

const URL_HOSTNAME = 'translate.lmgttfy.com';
const REPORT_MAILTO = 'mailto:hello@lmgttfy.com?subject=Report%20URL';
const FRAME_MS = 16;
const INITIAL_CURSOR: Point = { x: 60, y: 80 };

type Anchor = 'src' | 'tgt';

interface DdItem {
  label: string;
}

const SRC_DD_ITEMS: DdItem[] = [
  { label: SRC_AUTO_LABEL },
  ...LANG_CODES.map((c) => ({ label: LANGUAGES[c] })),
];

const TGT_DD_ITEMS: DdItem[] = LANG_CODES.map((c) => ({ label: LANGUAGES[c] }));

type ParseState =
  | { kind: 'pending' }
  | { kind: 'ok'; parts: RecipientUrlParts }
  | { kind: 'error'; error: ValidationError; rawSrc?: string; rawTgt?: string };

interface DropdownState {
  visible: boolean;
  highlightedLabel: string | null;
  items: DdItem[];
  style: { left: number; top: number; width: number };
}

const HIDDEN_DROPDOWN: DropdownState = {
  visible: false,
  highlightedLabel: null,
  items: [],
  style: { left: 0, top: 0, width: 0 },
};

function srcLabelFor(src: SrcLangCode): string {
  return src === 'auto' ? SRC_AUTO_LABEL : LANGUAGES[src];
}

function tgtLabelFor(tgt: LangCode): string {
  return LANGUAGES[tgt];
}

// Modest CSS.escape fallback for older browsers / SSR preview.
function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(s);
  }
  return s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}

export function Walkthrough() {
  const [parsed, setParsed] = useState<ParseState>({ kind: 'pending' });
  const [theme, setTheme] = useState<Theme>('warm');
  const [srcLabel, setSrcLabel] = useState<string>(SRC_AUTO_LABEL);
  const [tgtLabel, setTgtLabel] = useState<string>('English');
  const [srcActive, setSrcActive] = useState(false);
  const [tgtActive, setTgtActive] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownState>(HIDDEN_DROPDOWN);
  const [revealVisible, setRevealVisible] = useState(false);
  // Bump to replay the sequence in place. The sequence effect depends on
  // both `parsed` and `runId`, so each bump tears the previous run down via
  // its cleanup (cancelled = true) and starts a fresh one.
  const [runId, setRunId] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const srcLangRef = useRef<HTMLDivElement>(null);
  const tgtLangRef = useRef<HTMLDivElement>(null);
  const srcPanelRef = useRef<HTMLDivElement>(null);
  const srcTextRef = useRef<HTMLDivElement>(null);
  const srcCaretRef = useRef<HTMLDivElement>(null);
  const cursorPos = useRef<Point>(INITIAL_CURSOR);
  const cancelled = useRef(false);

  // ---- URL parsing on mount ------------------------------------------------
  // setState on mount is intentional: window.location is unavailable during
  // static export so we can't seed this synchronously.
  useEffect(() => {
    const result = parseRecipientUrl(
      window.location.pathname,
      window.location.search,
    );
    /* eslint-disable react-hooks/set-state-in-effect */
    if (result.ok) {
      setParsed({ kind: 'ok', parts: result.parts });
      setTheme(result.parts.theme);
    } else {
      const segs = window.location.pathname.split('/').filter(Boolean);
      setParsed({
        kind: 'error',
        error: result.error,
        rawSrc: segs[0],
        rawTgt: segs[1],
      });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // ---- Body classes for layout + theme -------------------------------------
  useEffect(() => {
    document.body.classList.add('walkthrough');
    return () => {
      document.body.classList.remove('walkthrough');
    };
  }, []);

  useEffect(() => {
    THEMES.forEach((t) => document.body.classList.remove(`theme-${t}`));
    if (theme !== 'warm') {
      document.body.classList.add(`theme-${theme}`);
    }
    refreshCursorSvg();
  }, [theme]);

  function refreshCursorSvg() {
    if (!cursorRef.current) return;
    const styles = getComputedStyle(document.body);
    const color = styles.getPropertyValue('--wk-cursor-color').trim() || 'black';
    const stroke = styles.getPropertyValue('--wk-cursor-stroke').trim() || 'white';
    cursorRef.current.style.backgroundImage = makeCursorSvg(color, stroke);
  }

  function setCursor(p: Point) {
    cursorPos.current = p;
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  }

  function rectInRoot(el: Element) {
    const r = el.getBoundingClientRect();
    const root = rootRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      cx: r.left - root.left + r.width / 2,
      cy: r.top - root.top + r.height / 2,
      left: r.left - root.left,
      top: r.top - root.top,
      width: r.width,
      height: r.height,
    };
  }

  async function moveCursor(target: Point, durationMs: number) {
    const plan = planMove(cursorPos.current, target, durationMs);
    const start = { ...cursorPos.current };
    const phase1End = plan.overshoot ?? plan.final;

    for (let i = 1; i <= plan.framesPhase1; i++) {
      if (cancelled.current) return;
      const t = i / plan.framesPhase1;
      const p = lerp(start, phase1End, t);
      const j = plan.frameJitter[i - 1];
      setCursor({ x: p.x + j.x, y: p.y + j.y });
      await sleep(FRAME_MS);
    }

    if (plan.overshoot) {
      const fromOvershoot = { ...cursorPos.current };
      for (let i = 1; i <= plan.framesPhase2; i++) {
        if (cancelled.current) return;
        const t = i / plan.framesPhase2;
        setCursor(lerp(fromOvershoot, plan.final, t));
        await sleep(FRAME_MS);
      }
    }
    await sleep(rand(80, 180));
  }

  async function clickPress(el: HTMLElement) {
    el.style.transition = 'transform 0.08s';
    el.style.transform = 'scale(0.985)';
    await sleep(90);
    el.style.transform = 'scale(1)';
  }

  function showDropdown(anchorEl: HTMLElement, items: DdItem[]) {
    const r = rectInRoot(anchorEl);
    setDropdown({
      visible: true,
      highlightedLabel: null,
      items,
      style: { left: r.left, top: r.top + r.height + 4, width: r.width },
    });
  }

  function hideDropdown() {
    setDropdown(HIDDEN_DROPDOWN);
  }

  function setHighlight(label: string | null) {
    setDropdown((d) => ({ ...d, highlightedLabel: label }));
  }

  async function selectLanguage(
    anchor: Anchor,
    targetLabel: string,
    items: DdItem[],
  ) {
    const selectEl =
      anchor === 'src' ? srcLangRef.current : tgtLangRef.current;
    if (!selectEl) return;

    if (anchor === 'src') setSrcActive(true);
    else setTgtActive(true);

    const r = rectInRoot(selectEl);
    await moveCursor({ x: r.cx, y: r.cy }, rand(600, 850));
    if (cancelled.current) return;

    await clickPress(selectEl);
    showDropdown(selectEl, items);
    // Give React a tick to commit the dropdown into the DOM before we query items.
    await sleep(rand(300, 500));
    if (cancelled.current) return;

    const root = rootRef.current;
    if (!root) return;

    const targetIdx = items.findIndex((i) => i.label === targetLabel);
    // Scan a couple of distractors before landing on the target — feels more
    // like someone scrolling a menu than teleporting.
    const scanIdxs = Array.from(
      new Set(
        [0, Math.min(2, items.length - 1), targetIdx].filter((i) => i >= 0),
      ),
    );

    for (const idx of scanIdxs) {
      if (cancelled.current) return;
      const item = items[idx];
      setHighlight(item.label);
      await sleep(60);
      const itemEl = root.querySelector<HTMLElement>(
        `[data-wk-dd-label="${cssEscape(item.label)}"]`,
      );
      if (itemEl) {
        const ir = rectInRoot(itemEl);
        await moveCursor({ x: ir.cx, y: ir.cy }, rand(250, 420));
      }
    }

    if (cancelled.current) return;
    await sleep(rand(150, 300));

    const finalEl = root.querySelector<HTMLElement>(
      `[data-wk-dd-label="${cssEscape(targetLabel)}"]`,
    );
    if (finalEl) await clickPress(finalEl);

    if (anchor === 'src') {
      setSrcLabel(targetLabel);
      setSrcActive(false);
    } else {
      setTgtLabel(targetLabel);
      setTgtActive(false);
    }
    hideDropdown();
    await sleep(rand(200, 400));
  }

  async function typeText(text: string) {
    const panelEl = srcPanelRef.current;
    const textEl = srcTextRef.current;
    const caretEl = srcCaretRef.current;
    if (!panelEl || !textEl || !caretEl) return;

    const pr = rectInRoot(panelEl);
    await moveCursor({ x: pr.left + 30, y: pr.top + 30 }, rand(500, 700));
    if (cancelled.current) return;
    await clickPress(panelEl);
    caretEl.classList.add('wk-visible');

    const updateCaret = () => {
      const range = document.createRange();
      const panelRect = panelEl.getBoundingClientRect();
      if (textEl.firstChild) {
        range.selectNodeContents(textEl);
        range.collapse(false);
        const r = range.getBoundingClientRect();
        caretEl.style.left = `${r.right - panelRect.left + 16}px`;
        caretEl.style.top = `${r.top - panelRect.top + 16}px`;
      } else {
        caretEl.style.left = '16px';
        caretEl.style.top = '16px';
      }
    };
    updateCaret();

    for (let i = 0; i < text.length; i++) {
      if (cancelled.current) return;
      textEl.textContent = text.substring(0, i + 1);
      updateCaret();
      await sleep(pickTypingDelay(text[i]));
    }

    await sleep(rand(300, 500));
    caretEl.classList.remove('wk-visible');
    await sleep(800);
  }

  // ---- Run the walkthrough sequence ---------------------------------------
  useEffect(() => {
    if (parsed.kind !== 'ok') return;

    cancelled.current = false;
    refreshCursorSvg();
    setCursor(INITIAL_CURSOR);

    const parts = parsed.parts;
    const targetSrcLabel = srcLabelFor(parts.src);
    const targetTgtLabel = tgtLabelFor(parts.tgt);

    const sequence = async () => {
      try {
        await sleep(700);
        if (cancelled.current) return;
        await selectLanguage('src', targetSrcLabel, SRC_DD_ITEMS);
        if (cancelled.current) return;
        await selectLanguage('tgt', targetTgtLabel, TGT_DD_ITEMS);
        if (cancelled.current) return;
        await typeText(parts.text);
        if (cancelled.current) return;
        setRevealVisible(true);
      } catch {
        // Sequence aborted (likely unmount mid-await). Nothing useful to log.
      }
    };

    void sequence();

    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, runId]);

  // ---- Skip handler --------------------------------------------------------
  const handleSkip = () => {
    cancelled.current = true;
    setRevealVisible(true);
  };

  // ---- Replay handler ------------------------------------------------------
  // Resets the transient UI state the sequence accumulates (selected labels,
  // typed text, caret) so the replay starts from the same blank slate the
  // first run did, then bumps runId to retrigger the sequence effect.
  const handleReplay = () => {
    cancelled.current = true;
    setRevealVisible(false);
    setSrcLabel(SRC_AUTO_LABEL);
    setTgtLabel('English');
    setSrcActive(false);
    setTgtActive(false);
    setDropdown(HIDDEN_DROPDOWN);
    if (srcTextRef.current) srcTextRef.current.textContent = '';
    srcCaretRef.current?.classList.remove('wk-visible');
    setRunId((n) => n + 1);
  };

  // ---- Render --------------------------------------------------------------
  if (parsed.kind === 'pending') {
    // Empty shell — avoids hydration of stale labels before URL is known.
    return <div className="wk-root" aria-hidden="true" />;
  }
  if (parsed.kind === 'error') {
    return (
      <ErrorWalkthrough
        error={parsed.error}
        rawSrc={parsed.rawSrc}
        rawTgt={parsed.rawTgt}
      />
    );
  }

  const googleUrl = buildGoogleTranslateUrl(parsed.parts);

  return (
    <>
      <ParodyBanner />
      <div className="wk-root" ref={rootRef}>
        <div className="wk-browser">
          <div className="wk-chrome">
            <div className="wk-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="wk-urlbar">{URL_HOSTNAME}</div>
          </div>
          <div className="wk-site">
            <div className="wk-site-header">
              <div className="wk-wordmark">
                lmgttfy<span className="wk-dot">.</span>translate
              </div>
            </div>
            <div className="wk-lang-row">
              <div
                ref={srcLangRef}
                className={`wk-lang-select ${srcActive ? 'active' : ''}`}
              >
                <span className="wk-lang-label">{srcLabel}</span>
                <span className="wk-caret">▾</span>
              </div>
              <div className="wk-swap" aria-hidden="true">
                ⇄
              </div>
              <div
                ref={tgtLangRef}
                className={`wk-lang-select ${tgtActive ? 'active' : ''}`}
              >
                <span className="wk-lang-label">{tgtLabel}</span>
                <span className="wk-caret">▾</span>
              </div>
            </div>
            <div className="wk-panels">
              <div className="wk-panel" ref={srcPanelRef}>
                <div className="wk-panel-text" ref={srcTextRef} />
                <div className="wk-panel-caret" ref={srcCaretRef}>
                  |
                </div>
              </div>
              <div className="wk-panel wk-translated">
                <div className="wk-panel-text wk-panel-placeholder">…</div>
              </div>
            </div>
          </div>
        </div>
        <div ref={cursorRef} className="wk-cursor" aria-hidden="true" />
        <div
          className={`wk-dropdown ${dropdown.visible ? 'wk-visible' : ''}`}
          aria-hidden="true"
          style={{
            left: `${dropdown.style.left}px`,
            top: `${dropdown.style.top}px`,
            width: `${dropdown.style.width}px`,
          }}
        >
          {dropdown.items.map((item) => (
            <div
              key={item.label}
              className={`wk-dd-item ${
                dropdown.highlightedLabel === item.label ? 'wk-highlighted' : ''
              }`}
              data-wk-dd-label={item.label}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
      <SkipButton hidden={revealVisible} onClick={handleSkip} />
      <RevealScreen
        visible={revealVisible}
        googleUrl={googleUrl}
        reportMailto={REPORT_MAILTO}
        theme={theme}
        src={parsed.parts.src}
        tgt={parsed.parts.tgt}
        onThemeChange={setTheme}
        onReplay={handleReplay}
      />
    </>
  );
}
