interface StepTextProps {
  question: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  error?: string;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
  maxLength?: number;
}

export default function StepText({
  question,
  value,
  onChange,
  onNext,
  error,
  placeholder = '',
  inputMode = 'text',
  maxLength,
}: StepTextProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-white text-2xl font-semibold leading-snug">{question}</h2>
      <input
        type={inputMode === 'numeric' || inputMode === 'tel' ? 'tel' : 'text'}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onNext()}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-lg placeholder-white/40 focus:outline-none focus:border-[#E84C88] transition"
        autoFocus
      />
      {error && <p className="text-[#E84C88] text-sm">{error}</p>}
      <button
        onClick={onNext}
        className="w-full bg-[#E84C88] text-white font-semibold text-lg rounded-xl py-4 mt-2 active:opacity-80 transition"
      >
        Continuar
      </button>
    </div>
  );
}
