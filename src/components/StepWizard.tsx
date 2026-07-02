import { useState } from 'react';
import type { FormData, TiempoActividad } from '../types/lead';
import { isCalificado } from '../lib/qualification';
import { readUTMParams } from '../lib/utm';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import ProgressBar from './ProgressBar';
import StepText from './StepText';
import StepEmail from './StepEmail';
import StepChoice from './StepChoice';
import StepConsent from './StepConsent';
import ResultScreen from './ResultScreen';

type StepId =
  | 'nombre'
  | 'email'
  | 'celular'
  | 'ciudad'
  | 'ciudad_otra'
  | 'plataforma'
  | 'plataforma_otra'
  | 'cuenta_propia'
  | 'tiempo_actividad'
  | 'consent';

const CIUDAD_OPTIONS = [
  { label: 'Bogotá', value: 'Bogotá' },
  { label: 'Medellín', value: 'Medellín' },
  { label: 'Bucaramanga', value: 'Bucaramanga' },
  { label: 'Neiva', value: 'Neiva' },
  { label: 'Villavicencio', value: 'Villavicencio' },
  { label: 'Otra ciudad', value: 'Otra ciudad' },
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
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ calificado: boolean } | null>(null);

  const currentIndex = BASE_STEP_ORDER.indexOf(
    stepId === 'ciudad_otra' ? 'ciudad' : stepId === 'plataforma_otra' ? 'plataforma' : stepId,
  );

  function goTo(id: StepId) {
    setError(undefined);
    setStepId(id);
  }

  function afterCiudad() {
    if (data.ciudad === 'Otra ciudad') {
      goTo('ciudad_otra');
    } else {
      goTo('plataforma');
    }
  }

  function afterPlataforma() {
    if (data.plataforma === 'Otra') {
      goTo('plataforma_otra');
    } else {
      goTo('cuenta_propia');
    }
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

  function handleCiudadOtraNext() {
    if (data.ciudad_otra.trim().length < 2) {
      setError('Cuéntanos en qué ciudad vives.');
      return;
    }
    goTo('plataforma');
  }

  function handlePlataformaOtraNext() {
    if (data.plataforma_otra.trim().length < 2) {
      setError('Cuéntanos en qué app trabajas.');
      return;
    }
    goTo('cuenta_propia');
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
      celular: data.celular.trim(),
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

    setResult({ calificado });
  }

  return (
    <div className="min-h-svh w-full flex flex-col bg-[#1A1A2E]">
      {!result && (
        <div className="px-6 pt-6">
          <ProgressBar current={currentIndex + 1} total={BASE_STEP_ORDER.length} />
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md w-full mx-auto">
        <Logo />

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
          <StepText
            question="¿Cuál es tu número de WhatsApp?"
            value={data.celular}
            onChange={(v) => setData({ ...data, celular: v.replace(/\D/g, '').slice(0, 10) })}
            onNext={handleCelularNext}
            error={error}
            placeholder="3001234567"
            inputMode="numeric"
            maxLength={10}
          />
        )}

        {!result && stepId === 'ciudad' && (
          <StepChoice
            question="¿En qué ciudad vives?"
            options={CIUDAD_OPTIONS}
            selected={data.ciudad}
            onSelect={(v) => setData({ ...data, ciudad: v })}
            onNext={afterCiudad}
            error={error}
          />
        )}

        {!result && stepId === 'ciudad_otra' && (
          <StepText
            question="¿Cuál ciudad?"
            value={data.ciudad_otra}
            onChange={(v) => setData({ ...data, ciudad_otra: v })}
            onNext={handleCiudadOtraNext}
            error={error}
          />
        )}

        {!result && stepId === 'plataforma' && (
          <StepChoice
            question="¿En qué app trabajas como domiciliario?"
            options={PLATAFORMA_OPTIONS}
            selected={data.plataforma}
            onSelect={(v) => setData({ ...data, plataforma: v })}
            onNext={afterPlataforma}
            error={error}
          />
        )}

        {!result && stepId === 'plataforma_otra' && (
          <StepText
            question="¿Cuál app?"
            value={data.plataforma_otra}
            onChange={(v) => setData({ ...data, plataforma_otra: v })}
            onNext={handlePlataformaOtraNext}
            error={error}
          />
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
