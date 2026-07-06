import { useState } from 'react';
import type { FormData, TiempoActividad } from '../types/lead';
import { isCalificado } from '../lib/qualification';
import { readUTMParams } from '../lib/utm';
import { supabase } from '../lib/supabase';
import heroDesktop from '../assets/hero/hero-desktop.jpg';
import heroMobile from '../assets/hero/hero-mobile.jpg';
import Logo from './Logo';
import ProgressBar from './ProgressBar';
import StepText from './StepText';
import StepEmail from './StepEmail';
import StepChoice from './StepChoice';
import StepConsent from './StepConsent';
import ResultScreen from './ResultScreen';
import WhatsAppIcon from './WhatsAppIcon';

type StepId =
  | 'nombre'
  | 'email'
  | 'celular'
  | 'ciudad'
  | 'plataforma'
  | 'cuenta_propia'
  | 'tiempo_actividad'
  | 'consent';

const CIUDAD_OPTIONS = [
  { label: 'Bogotá', value: 'Bogotá' },
  { label: 'Medellín', value: 'Medellín' },
  { label: 'Cali', value: 'Cali' },
  { label: 'Barranquilla', value: 'Barranquilla' },
  { label: 'Cartagena', value: 'Cartagena' },
  { label: 'Bucaramanga', value: 'Bucaramanga' },
  { label: 'Pereira', value: 'Pereira' },
  { label: 'Manizales', value: 'Manizales' },
  { label: 'Cúcuta', value: 'Cúcuta' },
  { label: 'Ibagué', value: 'Ibagué' },
  { label: 'Santa Marta', value: 'Santa Marta' },
  { label: 'Neiva', value: 'Neiva' },
  { label: 'Villavicencio', value: 'Villavicencio' },
  { label: 'Otra ciudad', value: 'Otra ciudad' },
];

const COUNTRY_CODES = [
  { code: '+57', flag: '🇨🇴', country: 'Colombia' },
  { code: '+52', flag: '🇲🇽', country: 'México' },
  { code: '+51', flag: '🇵🇪', country: 'Perú' },
  { code: '+593', flag: '🇪🇨', country: 'Ecuador' },
  { code: '+58', flag: '🇻🇪', country: 'Venezuela' },
  { code: '+54', flag: '🇦🇷', country: 'Argentina' },
  { code: '+56', flag: '🇨🇱', country: 'Chile' },
  { code: '+34', flag: '🇪🇸', country: 'España' },
  { code: '+1', flag: '🇺🇸', country: 'Estados Unidos' },
];

const PLATAFORMA_OPTIONS = [
  { label: 'Rappi', value: 'Rappi' },
  { label: 'DiDi Repartidor', value: 'DiDi Repartidor' },
  { label: 'Mensajeros Urbanos', value: 'Mensajeros Urbanos' },
  { label: 'Picap', value: 'Picap' },
  { label: 'Otra', value: 'Otra' },
];

const CUENTA_PROPIA_OPTIONS = [
  { label: 'Sí, es mía', value: 'si' },
  { label: 'No, es de otra persona', value: 'no' },
];

const TIEMPO_OPTIONS: { label: string; value: TiempoActividad }[] = [
  { label: 'De 1 a 2 meses', value: '1_2_meses' },
  { label: 'De 3 a 5 meses', value: '3_5_meses' },
  { label: 'De 6 a 12 meses', value: '6_12_meses' },
  { label: 'Hace más de 1 año', value: 'mas_1_anio' },
];

const BASE_STEP_ORDER: StepId[] = [
  'nombre',
  'email',
  'celular',
  'ciudad',
  'plataforma',
  'cuenta_propia',
  'tiempo_actividad',
  'consent',
];

const initialFormData: FormData = {
  nombre: '',
  email: '',
  celular: '',
  ciudad: '',
  ciudad_otra: '',
  plataforma: '',
  plataforma_otra: '',
  cuenta_propia: null,
  tiempo_actividad: null,
  acepta_tratamiento_datos: false,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StepWizard() {
  const [stepId, setStepId] = useState<StepId>('nombre');
  const [data, setData] = useState<FormData>(initialFormData);
  const [indicativo, setIndicativo] = useState(COUNTRY_CODES[0].code);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ calificado: boolean } | null>(null);

  const currentIndex = BASE_STEP_ORDER.indexOf(stepId);

  function goTo(id: StepId) {
    setError(undefined);
    setStepId(id);
  }

  function goBack() {
    setError(undefined);
    switch (stepId) {
      case 'email':
        setStepId('nombre');
        break;
      case 'celular':
        setStepId('email');
        break;
      case 'ciudad':
        setStepId('celular');
        break;
      case 'plataforma':
        setStepId('ciudad');
        break;
      case 'cuenta_propia':
        setStepId('plataforma');
        break;
      case 'tiempo_actividad':
        setStepId('cuenta_propia');
        break;
      case 'consent':
        setStepId('tiempo_actividad');
        break;
      default:
        break;
    }
  }

  function handleCiudadSelect(value: string) {
    setError(undefined);
    setData({ ...data, ciudad: value, ciudad_otra: value === 'Otra ciudad' ? data.ciudad_otra : '' });
    if (value !== 'Otra ciudad') {
      setTimeout(() => goTo('plataforma'), 180);
    }
  }

  function handleCiudadNext() {
    if (data.ciudad === 'Otra ciudad' && data.ciudad_otra.trim().length < 2) {
      setError('Cuéntanos en qué ciudad vives.');
      return;
    }
    goTo('plataforma');
  }

  function handlePlataformaSelect(value: string) {
    setError(undefined);
    setData({ ...data, plataforma: value, plataforma_otra: value === 'Otra' ? data.plataforma_otra : '' });
    if (value !== 'Otra') {
      setTimeout(() => goTo('cuenta_propia'), 180);
    }
  }

  function handlePlataformaNext() {
    if (data.plataforma === 'Otra' && data.plataforma_otra.trim().length < 2) {
      setError('Cuéntanos en qué app trabajas.');
      return;
    }
    goTo('cuenta_propia');
  }

  function handleNombreNext() {
    if (data.nombre.trim().length < 3) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    goTo('email');
  }

  function handleEmailNext() {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      setError('Ingresa un correo válido.');
      return;
    }
    goTo('celular');
  }

  function handleCelularNext() {
    if (!/^\d{10}$/.test(data.celular.trim())) {
      setError('Ingresa un número de WhatsApp válido (10 dígitos).');
      return;
    }
    goTo('ciudad');
  }

  async function handleSubmit() {
    if (!data.acepta_tratamiento_datos) {
      setError('Debes autorizar el tratamiento de tus datos para continuar.');
      return;
    }
    setError(undefined);
    setLoading(true);

    const calificado = isCalificado({
      plataforma: data.plataforma,
      cuenta_propia: data.cuenta_propia as boolean,
      tiempo_actividad: data.tiempo_actividad as TiempoActividad,
    });
    const utm = readUTMParams();

    const { error: insertError } = await supabase.from('landing_rappitenderos').insert({
      nombre: data.nombre.trim(),
      email: data.email.trim(),
      celular: `${indicativo}${data.celular.trim()}`,
      ciudad: data.ciudad,
      ciudad_otra: data.ciudad === 'Otra ciudad' ? data.ciudad_otra.trim() : null,
      plataforma: data.plataforma,
      plataforma_otra: data.plataforma === 'Otra' ? data.plataforma_otra.trim() : null,
      cuenta_propia: data.cuenta_propia,
      tiempo_actividad: data.tiempo_actividad,
      calificado,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      acepta_tratamiento_datos: data.acepta_tratamiento_datos,
    });

    setLoading(false);

    if (insertError) {
      setError('Ocurrió un error al enviar tu información. Intenta de nuevo.');
      return;
    }

    window.ttq?.track('CompleteRegistration', { content_name: calificado ? 'calificado' : 'no_calificado' });

    setResult({ calificado });
  }

  return (
    <div className="relative min-h-svh w-full flex flex-col bg-[#1A1A2E] overflow-hidden">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src={heroMobile}
          alt=""
          className="block md:hidden w-full h-full object-cover object-top blur-lg scale-110 opacity-40"
        />
        <img
          src={heroDesktop}
          alt=""
          className="hidden md:block w-full h-full object-cover blur-lg scale-110 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/70 via-[#1A1A2E]/85 to-[#1A1A2E]" />
      </div>

      {!result && (
        <div className="relative z-10 px-6 pt-6">
          <ProgressBar current={currentIndex + 1} total={BASE_STEP_ORDER.length} />
        </div>
      )}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-8 max-w-md w-full mx-auto -translate-y-10">
        <Logo />

        {!result && stepId !== 'nombre' && (
          <button
            onClick={goBack}
            aria-label="Volver a la pregunta anterior"
            className="self-start mb-3 -ml-1 p-1 text-white/60 active:text-white transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {result && <ResultScreen calificado={result.calificado} />}

        {!result && stepId === 'nombre' && (
          <StepText
            question="¿Cómo te llamas?"
            value={data.nombre}
            onChange={(v) => setData({ ...data, nombre: v })}
            onNext={handleNombreNext}
            error={error}
            placeholder="Tu nombre completo"
          />
        )}

        {!result && stepId === 'email' && (
          <StepEmail
            value={data.email}
            onChange={(v) => setData({ ...data, email: v })}
            onNext={handleEmailNext}
            error={error}
          />
        )}

        {!result && stepId === 'celular' && (
          <div className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-white text-2xl font-semibold leading-snug">
              <WhatsAppIcon className="w-6 h-6 text-[#25D366] flex-shrink-0" />
              ¿Cuál es tu número de WhatsApp?
            </h2>
            <div className="flex gap-2">
              <select
                value={indicativo}
                onChange={(e) => setIndicativo(e.target.value)}
                aria-label="Indicativo de país"
                className="bg-white/10 border border-white/20 rounded-xl px-2 text-white text-lg focus:outline-none focus:border-[#E84C88] transition"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#1A1A2E]">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                value={data.celular}
                onChange={(e) => setData({ ...data, celular: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                onKeyDown={(e) => e.key === 'Enter' && handleCelularNext()}
                placeholder="3001234567"
                maxLength={10}
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-lg placeholder-white/40 focus:outline-none focus:border-[#E84C88] transition"
                autoFocus
              />
            </div>
            {error && <p className="text-[#E84C88] text-sm">{error}</p>}
            <button
              onClick={handleCelularNext}
              className="w-full bg-[#E84C88] text-white font-semibold text-lg rounded-xl py-4 mt-2 active:opacity-80 transition"
            >
              Continuar
            </button>
          </div>
        )}

        {!result && stepId === 'ciudad' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-white text-2xl font-semibold leading-snug">
              ¿En qué ciudad trabajas/trabajaste como domiciliario?
            </h2>
            <p className="text-white/50 text-sm -mt-1">
              Si trabajas o trabajaste en varias, coloca la ciudad principal.
            </p>
            <div className="flex flex-col gap-3">
              {CIUDAD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCiudadSelect(opt.value)}
                  className={`w-full text-left px-4 py-4 rounded-xl border text-lg font-medium transition
                    ${data.ciudad === opt.value
                      ? 'bg-[#E84C88] border-[#E84C88] text-white'
                      : 'bg-white/10 border-white/20 text-white active:bg-white/20'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {data.ciudad === 'Otra ciudad' && (
              <input
                type="text"
                value={data.ciudad_otra}
                onChange={(e) => setData({ ...data, ciudad_otra: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCiudadNext()}
                placeholder="Escribe tu ciudad"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-lg placeholder-white/40 focus:outline-none focus:border-[#E84C88] transition"
                autoFocus
              />
            )}
            {error && <p className="text-[#E84C88] text-sm">{error}</p>}
            {data.ciudad === 'Otra ciudad' && (
              <button
                onClick={handleCiudadNext}
                className="w-full bg-[#E84C88] text-white font-semibold text-lg rounded-xl py-4 mt-2 active:opacity-80 transition"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {!result && stepId === 'plataforma' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-white text-2xl font-semibold leading-snug">¿En qué app trabajas como domiciliario?</h2>
            <div className="flex flex-col gap-3">
              {PLATAFORMA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePlataformaSelect(opt.value)}
                  className={`w-full text-left px-4 py-4 rounded-xl border text-lg font-medium transition
                    ${data.plataforma === opt.value
                      ? 'bg-[#E84C88] border-[#E84C88] text-white'
                      : 'bg-white/10 border-white/20 text-white active:bg-white/20'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {data.plataforma === 'Otra' && (
              <input
                type="text"
                value={data.plataforma_otra}
                onChange={(e) => setData({ ...data, plataforma_otra: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handlePlataformaNext()}
                placeholder="Escribe la app"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-lg placeholder-white/40 focus:outline-none focus:border-[#E84C88] transition"
                autoFocus
              />
            )}
            {error && <p className="text-[#E84C88] text-sm">{error}</p>}
            {data.plataforma === 'Otra' && (
              <button
                onClick={handlePlataformaNext}
                className="w-full bg-[#E84C88] text-white font-semibold text-lg rounded-xl py-4 mt-2 active:opacity-80 transition"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {!result && stepId === 'cuenta_propia' && (
          <StepChoice
            question="¿Esa cuenta es tuya?"
            options={CUENTA_PROPIA_OPTIONS}
            selected={data.cuenta_propia === null ? '' : data.cuenta_propia ? 'si' : 'no'}
            onSelect={(v) => setData({ ...data, cuenta_propia: v === 'si' })}
            onNext={() => goTo('tiempo_actividad')}
            error={error}
          />
        )}

        {!result && stepId === 'tiempo_actividad' && (
          <StepChoice
            question="¿Hace cuánto tiempo haces pedidos en la app?"
            options={TIEMPO_OPTIONS}
            selected={data.tiempo_actividad ?? ''}
            onSelect={(v) => setData({ ...data, tiempo_actividad: v as TiempoActividad })}
            onNext={() => goTo('consent')}
            error={error}
          />
        )}

        {!result && stepId === 'consent' && (
          <StepConsent
            accepted={data.acepta_tratamiento_datos}
            onChange={(v) => setData({ ...data, acepta_tratamiento_datos: v })}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
