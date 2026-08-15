import { useState, useRef, useEffect, type ReactNode } from 'react';

interface Props {
  text: string;
  children: ReactNode;
}

interface TooltipState {
  anchorLeft: number;
  boxLeft: number;
  top: number;
}

export function Tooltip({ text, children }: Props) {
  const [state, setState] = useState<TooltipState | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setState(null), 150);
  }

  function cancelHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }

  function showTooltip() {
    if (showTimer.current) clearTimeout(showTimer.current);
    cancelHide();
    showTimer.current = setTimeout(() => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setState({
        anchorLeft: rect.left + rect.width / 2,
        boxLeft: rect.left + rect.width / 2,
        top: rect.top,
      });
    }, 80);
  }

  function hideTooltip() {
    if (showTimer.current) clearTimeout(showTimer.current);
    scheduleHide();
  }

  useEffect(() => {
    if (!state || !tooltipRef.current) return;
    const tip = tooltipRef.current.getBoundingClientRect();
    const padding = 8;
    if (tip.left < padding) {
      setState((s) => s && { ...s, boxLeft: s.boxLeft + (padding - tip.left) });
    } else if (tip.right > window.innerWidth - padding) {
      setState(
        (s) => s && { ...s, boxLeft: s.boxLeft - (tip.right - (window.innerWidth - padding)) },
      );
    }
  }, [state?.anchorLeft]);

  const arrowOffset = state ? state.anchorLeft - state.boxLeft : 0;

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {state && (
        <span
          ref={tooltipRef}
          className="fixed z-[9999]"
          style={{
            top: state.top - 8,
            left: state.boxLeft,
            transform: 'translate(-50%, -100%)',
            maxHeight: state.top - 16,
          }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <span
            className="block whitespace-pre rounded bg-gray-800 px-2 py-1 text-xs text-white overflow-y-auto"
            style={{ maxHeight: 'inherit' }}
          >
            {text}
          </span>
          <span
            className="absolute top-full border-4 border-transparent border-t-gray-800"
            style={{ left: `calc(50% + ${arrowOffset}px)`, transform: 'translateX(-50%)' }}
          />
        </span>
      )}
    </span>
  );
}
