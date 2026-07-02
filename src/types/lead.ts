export type TiempoActividad = '1_2_meses' | '3_5_meses' | '6_12_meses' | 'mas_1_anio';

export interface FormData {
  nombre: string;
  email: string;
  celular: string;
  ciudad: string;
  ciudad_otra: string;
  plataforma: string;
  plataforma_otra: string;
  cuenta_propia: boolean | null;
  tiempo_actividad: TiempoActividad | null;
  acepta_tratamiento_datos: boolean;
}

export interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface LeadRecord extends FormData {
  calificado: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}
