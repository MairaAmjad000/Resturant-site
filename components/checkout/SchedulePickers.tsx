"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Clock } from "lucide-react";

/* =========================================================
   Shared field chrome — identical to the checkout inputs
========================================================= */

const FIELD_BASE =
  "relative rounded-[10px] bg-[#f5f5f5] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ff8500]/60";
const fieldError = (error: boolean) =>
  error ? " ring-2 ring-[#e5484d]/50" : "";

const PANEL_BASE =
  "absolute left-0 bottom-[calc(100%+8px)] z-50 w-[300px] max-w-[calc(100vw-48px)] rounded-[14px] border border-[#e9e3db] bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.16)]";

/** Local (not UTC) yyyy-mm-dd for a given date. */
function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Closes a dropdown on outside pointerdown or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}

/* =========================================================
   DATE PICKER — themed calendar dropdown
========================================================= */

interface DatePickerProps {
  label?: string;
  value: string; // yyyy-mm-dd ("" = none)
  onChange: (value: string) => void;
  /** Earliest selectable date (yyyy-mm-dd). */
  min?: string;
  error?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ThemedDatePicker({
  label = "Date",
  value,
  onChange,
  min,
  error = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);

  const todayIso = toIso(new Date());
  const minIso = min ?? "0000-01-01";

  /** Month being displayed; starts on the value's month (or min/today). */
  const [view, setView] = useState(() => {
    const base = value || minIso || todayIso;
    const [y, m] = base.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  /** Derive the visible month from the value during render (no effect):
   *  if the value moves to a different month (e.g. Clear → Today), the
   *  view jumps along with it. Storing the source value lets us tell
   *  "value changed" apart from "user browsed months". */
  const [viewSource, setViewSource] = useState(value);
  if (value && value !== viewSource) {
    setViewSource(value);
    const [y, m] = value.split("-").map(Number);
    setView((current) =>
      current.year === y && current.month === m - 1
        ? current
        : { year: y, month: m - 1 }
    );
  }

  const canGoPrev = useMemo(() => {
    const [minY, minM] = minIso.split("-").map(Number);
    if (!minY) return true;
    return (
      view.year > minY || (view.year === minY && view.month > minM - 1)
    );
  }, [view, minIso]);

  const canGoNext = useMemo(() => {
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    return (
      view.year < max.getFullYear() ||
      (view.year === max.getFullYear() && view.month < max.getMonth())
    );
  }, [view]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1).getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    const blanks = Array.from({ length: first }, (_, i) => i);
    const daysCells = Array.from({ length: days }, (_, i) => i + 1);
    return { blanks, daysCells };
  }, [view]);

  const pick = (day: number) => {
    onChange(toIso(new Date(view.year, view.month, day)));
    close();
  };

  const goToday = () => {
    if (todayIso >= minIso) {
      onChange(todayIso);
      const now = new Date();
      setView({ year: now.getFullYear(), month: now.getMonth() });
    }
    close();
  };

  /** Format the field value: "Mon, 21 Sep 2026" style. */
  const display = useMemo(() => {
    if (!value) return "";
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [value]);

  return (
    <div ref={ref} className={`${FIELD_BASE}${fieldError(error)}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={display ? `Schedule date: ${display}` : "Choose schedule date"}
        className="h-[52px] w-full cursor-pointer rounded-[10px] px-[14px] pb-[5px] pl-[14px] pt-[24px] text-left"
      >
        <span className="pointer-events-none absolute left-[14px] top-[8px] text-[11px] font-medium text-[#9aa0a5]">
          {label}
        </span>
        <span
          className={`block truncate text-[14px] font-semibold ${
            display ? "text-[#15181a]" : "text-transparent"
          }`}
        >
          {display || "—"}
        </span>
      </button>

      <Calendar
        className="pointer-events-none absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#ff8500]"
        strokeWidth={2.2}
      />

      {open && (
        <div role="dialog" aria-label="Choose date" className={PANEL_BASE}>
          {/* Month header */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-[#15181a]">
              {MONTHS[view.month]} {view.year}
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  canGoPrev &&
                  setView((current) =>
                    current.month === 0
                      ? { year: current.year - 1, month: 11 }
                      : { ...current, month: current.month - 1 }
                  )
                }
                disabled={!canGoPrev}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#4a5157] transition hover:bg-[#fdecd8] hover:text-[#ff8500] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#4a5157]"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  canGoNext &&
                  setView((current) =>
                    current.month === 11
                      ? { year: current.year + 1, month: 0 }
                      : { ...current, month: current.month + 1 }
                  )
                }
                disabled={!canGoNext}
                aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#4a5157] transition hover:bg-[#fdecd8] hover:text-[#ff8500] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#4a5157]"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </span>
          </div>

          {/* Weekday header */}
          <div className="mt-3 grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-center text-[11px] font-bold uppercase tracking-wide text-[#9aa0a5]"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.blanks.map((blank) => (
              <span key={`b-${blank}`} />
            ))}
            {cells.daysCells.map((day) => {
              const iso = toIso(new Date(view.year, view.month, day));
              const disabled = iso < minIso;
              const selected = iso === value;
              const isToday = iso === todayIso;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  aria-label={`${view.year}-${view.month + 1}-${day}`}
                  aria-pressed={selected}
                  className={`mx-auto my-[2px] flex h-9 w-9 items-center justify-center rounded-[10px] text-[13px] font-semibold transition ${
                    selected
                      ? "bg-[#0e3b2e] text-white shadow-[0_4px_12px_rgba(14,59,46,0.35)]"
                      : isToday
                        ? "border border-[#ff8500] text-[#ff8500] hover:bg-[#fdecd8]"
                        : disabled
                          ? "text-[#d0d0d0]"
                          : "text-[#15181a] hover:bg-[#fdecd8]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-2 flex items-center justify-between border-t border-[#f0f0f0] pt-2">
            <button
              type="button"
              onClick={() => { onChange(""); close(); }}
              className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#4a5157] transition hover:bg-[#f5f1eb] hover:text-[#15181a]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#ff8500] transition hover:bg-[#fdecd8]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TIME PICKER — hour/minute steppers + AM/PM
========================================================= */

interface TimePickerProps {
  label?: string;
  value: string; // HH:MM ("" = none)
  onChange: (value: string) => void;
  /** Earliest settable time (HH:MM, 24h). */
  min?: string;
  error?: boolean;
}

const CLOSE_MINUTES = 22 * 60 + 30; // 22:30

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "17:00" → "5:00 PM" for the field label. */
function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function ThemedTimePicker({
  label = "Time",
  value,
  onChange,
  min,
  error = false,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);

  const minMinutes = min ? toMinutes(min) : 0;

  /** Local picker state — hour (1–12), minute (0–59), period. Seeded from
   *  the committed value (or opening time) each time the panel opens. */
  const [hour12, setHour12] = useState(5);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
  const [pickerError, setPickerError] = useState(false);

  const openPanel = () => {
    if (value) {
      const h24 = Number(value.split(":")[0]);
      setHour12(h24 % 12 === 0 ? 12 : h24 % 12);
      setMinute(Number(value.split(":")[1]));
      setPeriod(h24 >= 12 ? "PM" : "AM");
    } else {
      // Seed from the opening time so the spinners start somewhere valid.
      const openH24 = Math.floor(minMinutes / 60);
      setHour12(openH24 % 12 === 0 ? 12 : openH24 % 12);
      setMinute(minMinutes % 60);
      setPeriod(openH24 >= 12 ? "PM" : "AM");
    }
    setPickerError(false);
    setOpen(true);
  };

  const bumpHour = (delta: number) =>
    setHour12((h) => ((h - 1 + delta + 12) % 12) + 1);
  const bumpMinute = (delta: number) =>
    setMinute((m) => (m + delta + 60) % 60);

  const commit = () => {
    const h24 =
      period === "PM"
        ? hour12 % 12 + 12
        : hour12 % 12;
    const total = h24 * 60 + minute;

    if (total < minMinutes || total > CLOSE_MINUTES) {
      setPickerError(true);
      return;
    }

    onChange(fromMinutes(total));
    setPickerError(false);
    close();
  };

  const stepperBtn =
    "flex h-7 w-16 items-center justify-center rounded-[8px] text-[#4a5157] transition hover:bg-[#fdecd8] hover:text-[#ff8500]";

  return (
    <div ref={ref} className={`${FIELD_BASE}${fieldError(error || pickerError)}`}>
      <button
        type="button"
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `Schedule time: ${prettyTime(value)}` : "Choose schedule time"}
        className="h-[52px] w-full cursor-pointer rounded-[10px] px-[14px] pb-[5px] pl-[14px] pt-[24px] text-left"
      >
        <span className="pointer-events-none absolute left-[14px] top-[8px] text-[11px] font-medium text-[#9aa0a5]">
          {label}
        </span>
        <span
          className={`block truncate text-[14px] font-semibold ${
            value ? "text-[#15181a]" : "text-transparent"
          }`}
        >
          {value ? prettyTime(value) : "—"}
        </span>
      </button>

      <Clock
        className="pointer-events-none absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#ff8500]"
        strokeWidth={2.2}
      />

      {pickerError && (
        <p className="absolute left-0 top-full mt-1.5 whitespace-nowrap text-[12px] font-semibold text-[#c0392b]">
          Choose a time between {prettyTime(fromMinutes(minMinutes))} and {prettyTime(fromMinutes(CLOSE_MINUTES))}
        </p>
      )}

      {open && (
        <div role="dialog" aria-label="Choose time" className={PANEL_BASE}>
          <p className="text-[12px] font-bold uppercase tracking-[1px] text-[#9aa0a5]">
            Opening hours · 5:00 PM – 10:30 PM
          </p>

          {/* Steppers + AM/PM — same layout as the reference */}
          <div className="mt-3 flex items-start justify-center gap-3">
            {/* Hour */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => bumpHour(1)}
                aria-label="Hour up"
                className={stepperBtn}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="flex h-12 w-16 items-center justify-center rounded-[10px] border border-[#e9e3db] text-[20px] font-bold text-[#15181a]">
                {hour12}
              </div>
              <button
                type="button"
                onClick={() => bumpHour(-1)}
                aria-label="Hour down"
                className={stepperBtn}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <span className="mt-[46px] text-[20px] font-bold text-[#9aa0a5]">:</span>

            {/* Minute */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => bumpMinute(1)}
                aria-label="Minute up"
                className={stepperBtn}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="flex h-12 w-16 items-center justify-center rounded-[10px] border border-[#e9e3db] text-[20px] font-bold text-[#15181a]">
                {String(minute).padStart(2, "0")}
              </div>
              <button
                type="button"
                onClick={() => bumpMinute(-1)}
                aria-label="Minute down"
                className={stepperBtn}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* AM / PM */}
            <div className="mt-[38px] flex flex-col gap-2">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${
                      period === p ? "border-[#ff8500]" : "border-[#c9c9c9]"
                    }`}
                  >
                    {period === p && (
                      <span className="h-2 w-2 rounded-full bg-[#ff8500]" />
                    )}
                  </span>
                  <span
                    className={`text-[13px] font-semibold ${
                      period === p ? "text-[#15181a]" : "text-[#9aa0a5]"
                    }`}
                  >
                    {p}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={commit}
            className="mt-4 flex h-[44px] w-full items-center justify-center rounded-full bg-[#ff8500] text-[14px] font-bold text-white transition hover:bg-[#f07d00]"
          >
            Set time · {prettyTime(fromMinutes((period === "PM" ? hour12 % 12 + 12 : hour12 % 12) * 60 + minute))}
          </button>
        </div>
      )}
    </div>
  );
}
