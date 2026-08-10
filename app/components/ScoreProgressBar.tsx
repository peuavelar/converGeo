"use client";

interface ScoreProgressBarProps {
  label: string;
  value: number;
  colorClass: string;
}

export default function ScoreProgressBar({
  label,
  value,
  colorClass,
}: ScoreProgressBarProps) {
  const clamped = Math.max(0, Math.min(10, value));
  return (
    <div
      className={`rounded-lg border border-slate-100 bg-white shadow-sm print:border-slate-200 print:shadow-none ${
        label ? "p-3" : "px-0 py-1"
      }`}
    >
      {label ? (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 print:text-sm">
            {label}
          </span>
          <span className="text-sm font-black text-slate-800 print:text-lg">
            {clamped.toFixed(1)}
          </span>
        </div>
      ) : null}
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`${colorClass} h-1.5 rounded-full`}
          style={{ width: `${(clamped / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}
