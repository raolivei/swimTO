import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, X } from "lucide-react";

interface TimeRangeSliderProps {
  /** Start of range in minutes since midnight (0..1440) */
  start: number;
  /** End of range in minutes since midnight (0..1440) */
  end: number;
  /** Minutes between snapping points (e.g. 30 for half-hour) */
  step?: number;
  /** Min allowable hour (default 5am) */
  minMinute?: number;
  /** Max allowable hour (default 11pm) */
  maxMinute?: number;
  onChange: (start: number, end: number) => void;
  /** Resets to the full default range [minMinute, maxMinute] */
  onReset: () => void;
  /** True when [start, end] === default [minMinute, maxMinute] */
  isDefault: boolean;
}

/** 780 → "1PM" or "1:30PM" */
function formatMinute(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

type ThumbId = "start" | "end";

export function TimeRangeSlider({
  start,
  end,
  step = 30,
  minMinute = 5 * 60,
  maxMinute = 23 * 60,
  onChange,
  onReset,
  isDefault,
}: TimeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<ThumbId | null>(null);

  const span = maxMinute - minMinute;
  const startPct = useMemo(() => ((start - minMinute) / span) * 100, [start, minMinute, span]);
  const endPct = useMemo(() => ((end - minMinute) / span) * 100, [end, minMinute, span]);

  /** Convert a clientX coordinate to a snapped minute value, clamped to [min, max]. */
  const xToMinute = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return start;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = minMinute + ratio * span;
      const snapped = Math.round(raw / step) * step;
      return Math.max(minMinute, Math.min(maxMinute, snapped));
    },
    [minMinute, maxMinute, span, step, start]
  );

  /** Apply a minute value to the active thumb, enforcing [start+step <= end]. */
  const applyMinute = useCallback(
    (thumb: ThumbId, minute: number) => {
      if (thumb === "start") {
        const next = Math.min(minute, end - step);
        onChange(Math.max(minMinute, next), end);
      } else {
        const next = Math.max(minute, start + step);
        onChange(start, Math.min(maxMinute, next));
      }
    },
    [start, end, step, minMinute, maxMinute, onChange]
  );

  // Global pointer move/up handlers while dragging
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      applyMinute(dragging, xToMinute(e.clientX));
    };
    const onUp = () => setDragging(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, applyMinute, xToMinute]);

  /** Click anywhere on the track moves the *closer* thumb. */
  const onTrackPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const minute = xToMinute(e.clientX);
    const distStart = Math.abs(minute - start);
    const distEnd = Math.abs(minute - end);
    const thumb: ThumbId = distStart <= distEnd ? "start" : "end";
    applyMinute(thumb, minute);
    setDragging(thumb);
  };

  const startThumbDrag = (thumb: ThumbId) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(thumb);
  };

  const handleKey = (thumb: ThumbId) => (e: React.KeyboardEvent) => {
    const value = thumb === "start" ? start : end;
    let next = value;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + step;
    else if (e.key === "Home") next = minMinute;
    else if (e.key === "End") next = maxMinute;
    else return;
    e.preventDefault();
    applyMinute(thumb, next);
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="font-medium">Time of day</span>
        </div>
        {!isDefault && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 rounded transition-colors"
            aria-label="Reset time range"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Slider area: ~52px tall to fit the pill thumbs comfortably */}
      <div className="relative h-13 px-7" style={{ height: 52 }}>
        {/* Track (clickable) */}
        <div
          ref={trackRef}
          onPointerDown={onTrackPointerDown}
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
        >
          {/* Filled range */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
          />
        </div>

        {/* Start thumb */}
        <PillThumb
          label={formatMinute(start)}
          leftPct={startPct}
          active={dragging === "start"}
          onPointerDown={startThumbDrag("start")}
          onKeyDown={handleKey("start")}
          ariaLabel="Start time"
          ariaValue={start}
          ariaMin={minMinute}
          ariaMax={end - step}
        />

        {/* End thumb */}
        <PillThumb
          label={formatMinute(end)}
          leftPct={endPct}
          active={dragging === "end"}
          onPointerDown={startThumbDrag("end")}
          onKeyDown={handleKey("end")}
          ariaLabel="End time"
          ariaValue={end}
          ariaMin={start + step}
          ariaMax={maxMinute}
        />
      </div>

    </div>
  );
}

interface PillThumbProps {
  label: string;
  leftPct: number;
  active: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  ariaLabel: string;
  ariaValue: number;
  ariaMin: number;
  ariaMax: number;
}

function PillThumb({
  label,
  leftPct,
  active,
  onPointerDown,
  onKeyDown,
  ariaLabel,
  ariaValue,
  ariaMin,
  ariaMax,
}: PillThumbProps) {
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={ariaValue}
      aria-valuemin={ariaMin}
      aria-valuemax={ariaMax}
      tabIndex={0}
      className={`
        absolute top-1/2 -translate-y-1/2 -translate-x-1/2
        h-9 min-w-[60px] px-3
        rounded-full
        bg-white dark:bg-gray-900
        border-2
        text-xs font-bold tabular-nums
        text-indigo-700 dark:text-indigo-300
        shadow-md
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
        flex items-center justify-center gap-1
        touch-none
        ${
          active
            ? "border-purple-500 shadow-xl scale-110 cursor-grabbing z-30"
            : "border-indigo-500 hover:border-purple-500 hover:shadow-lg hover:scale-105 cursor-grab z-20"
        }
      `}
      style={{ left: `${leftPct}%` }}
    >
      {/* Tiny grip lines for visual affordance */}
      <span aria-hidden="true" className="flex flex-col gap-[2px] opacity-40 mr-0.5">
        <span className="block w-0.5 h-0.5 rounded-full bg-current" />
        <span className="block w-0.5 h-0.5 rounded-full bg-current" />
        <span className="block w-0.5 h-0.5 rounded-full bg-current" />
      </span>
      {label}
    </button>
  );
}
