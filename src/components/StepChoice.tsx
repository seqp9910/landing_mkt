interface Option {
  label: string;
  value: string;
}

interface StepChoiceProps {
  question: string;
  options: Option[];
  selected: string;
  onSelect: (v: string) => void;
  onNext: () => void;
  error?: string;
}

export default function StepChoice({ question, options, selected, onSelect, onNext, error }: StepChoiceProps) {
  const handleSelect = (value: string) => {
    onSelect(value);
    // Auto-advance on selection for choice steps
    setTimeout(onNext, 180);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-white text-2xl font-semibold leading-snug mb-2">{question}</h2>
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`w-full text-left px-4 py-4 rounded-xl border text-lg font-medium transition
              ${selected === opt.value
                ? 'bg-[#E84C88] border-[#E84C88] text-white'
                : 'bg-white/10 border-white/20 text-white active:bg-white/20'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-[#E84C88] text-sm mt-1">{error}</p>}
    </div>
  );
}
