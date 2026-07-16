const CODIGO_PROMOTOR_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];

interface StepConsentProps {
  accepted: boolean;
  onChange: (v: boolean) => void;
  codigoPromotor: string;
  onCodigoPromotorChange: (v: string) => void;
  onSubmit: () => void;
  error?: string;
  loading?: boolean;
}

export default function StepConsent({
  accepted,
  onChange,
  codigoPromotor,
  onCodigoPromotorChange,
  onSubmit,
  error,
  loading,
}: StepConsentProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-white text-2xl font-semibold leading-snug">Un último paso</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="codigo_promotor" className="text-white/80 text-base">
          Código de promotor <span className="text-white/40">(opcional)</span>
        </label>
        <select
          id="codigo_promotor"
          value={codigoPromotor}
          onChange={(e) => onCodigoPromotorChange(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#E84C88] transition"
        >
          <option value="" className="bg-[#1A1A2E]">
            Ninguno
          </option>
          {CODIGO_PROMOTOR_OPTIONS.map((code) => (
            <option key={code} value={code} className="bg-[#1A1A2E]">
              {code}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-5 h-5 accent-[#E84C88] flex-shrink-0"
        />
        <span className="text-white/80 text-base leading-relaxed">
          Autorizo a QPAlliance el tratamiento de mis datos personales conforme a la{' '}
          <a href="/privacidad.html" target="_blank" rel="noopener noreferrer" className="text-[#E84C88] underline">
            Política de Privacidad
          </a>
          , para ser contactado sobre mi proceso de defensa laboral.
        </span>
      </label>
      {error && <p className="text-[#E84C88] text-sm">{error}</p>}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-[#E84C88] text-white font-semibold text-lg rounded-xl py-4 mt-2 active:opacity-80 transition disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
}
