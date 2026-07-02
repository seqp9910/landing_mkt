import type { FormData } from '../types/lead';

export function isCalificado(data: Pick<FormData, 'plataforma' | 'cuenta_propia' | 'tiempo_actividad'>): boolean {
  return (
    data.plataforma === 'Rappi' &&
    data.cuenta_propia === true &&
    (data.tiempo_actividad === '6_12_meses' || data.tiempo_actividad === 'mas_1_anio')
  );
}
