export type SurveyDimension =
  | 'bienestar'
  | 'motivacion'
  | 'liderazgo'
  | 'comunicacion'
  | 'beneficios'
  | 'claridad_rol'
  | 'mejoras';

export type Sentiment = 'positivo' | 'neutro' | 'constructivo';

export interface SurveyComment {
  id: number;
  dimension: SurveyDimension;
  text: string;
  sentiment: Sentiment;
}

export interface DimensionMeta {
  key: SurveyDimension;
  label: string;
  color: string;         // color Tailwind bg
  textColor: string;     // color Tailwind text
  score: number;         // score sobre 10
}

export interface WordFrequency {
  word: string;
  count: number;
  dimension?: SurveyDimension;
}

export interface SurveyFilters {
  dimension: SurveyDimension | 'todas';
  sentiment: Sentiment | 'todos';
  search: string;
}