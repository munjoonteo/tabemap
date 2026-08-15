import { useRef, useState, useEffect, type ReactNode } from 'react';

export type SnapPoint = 'peek' | 'half' | 'full';

const SNAP: Record<SnapPoint, number> = {
  peek: 64,
  half: 0.5,
  full: 0.92,
};

interface Props {
  children: ReactNode;
  defaultSnap?: SnapPoint;
  snap: SnapPoint;
  onSnapChange: (s: SnapPoint) => void;
}

export function BottomSheet({ children, snap, onSnapChange }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const [height, setHeight] = useState<number | null>(null);

  function snapToPixels(s: SnapPoint, windowH: number): number {
    const v = SNAP[s];
    return typeof v === 'number' && v < 2 ? Math.round(windowH * v) : (v as number);
  }

  useEffect(() => {
    setHeight(snapToPixels(snap, window.innerHeight));
  }, [snap]);

  function onPointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    dragStartHeight.current = height ?? snapToPixels(snap, window.innerHeight);
    const el = sheetRef.current!;
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!e.buttons) return;
    const delta = dragStartY.current - e.clientY;
    const newH = Math.max(
      SNAP.peek as number,
      Math.min(window.innerHeight * 0.95, dragStartHeight.current + delta),
    );
    setHeight(newH);
  }

  function onPointerUp() {
    const windowH = window.innerHeight;
    const cur = height ?? snapToPixels(snap, windowH);
    const peekPx = SNAP.peek as number;
    const halfPx = windowH * SNAP.half;
    const fullPx = windowH * SNAP.full;

    const distances: [SnapPoint, number][] = [
      ['peek', Math.abs(cur - peekPx)],
      ['half', Math.abs(cur - halfPx)],
      ['full', Math.abs(cur - fullPx)],
    ];
    const nearest = distances.sort((a, b) => a[1] - b[1])[0][0];
    onSnapChange(nearest);
  }

  const h = height ?? snapToPixels(snap, typeof window !== 'undefined' ? window.innerHeight : 800);

  return (
    <div
      ref={sheetRef}
      style={{
        height: h,
        transition:
          height === snapToPixels(snap, window.innerHeight) ? 'height 0.25s ease' : 'none',
      }}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-40 flex flex-col touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing">
        <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
