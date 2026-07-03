interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="w-full h-1 bg-white/10 rounded-full">
        <div
          className="h-1 bg-[#E84C88] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/50 text-xs font-medium">
        Pregunta {current} de {total}
      </span>
    </div>
  );
}
