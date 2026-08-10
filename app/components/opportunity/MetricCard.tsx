"use client";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "up" | "down";
};

export default function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: Props) {
  const hintColor =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
        ? "text-rose-600"
        : "text-slate-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-900">
        {value}
      </p>
      {hint && <p className={`mt-0.5 text-[11px] font-medium ${hintColor}`}>{hint}</p>}
    </div>
  );
}
