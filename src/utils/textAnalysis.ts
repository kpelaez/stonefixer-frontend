// Procesa los comentarios de la encuesta y genera frecuencias de palabras
// para el word cloud. Sin dependencias externas.

import type { SurveyComment, WordFrequency } from '../types/hrSurvey';

// Palabras a ignorar (stopwords en español + términos irrelevantes)
const STOPWORDS = new Set([
  'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con',
  'contra', 'cual', 'cuando', 'de', 'del', 'desde', 'donde', 'durante',
  'e', 'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'eres',
  'es', 'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estas', 'este',
  'estos', 'fue', 'han', 'has', 'hay', 'he', 'hemos', 'i', 'la', 'las',
  'le', 'les', 'lo', 'los', 'me', 'mi', 'mis', 'muy', 'más', 'ni', 'no',
  'nos', 'o', 'otro', 'para', 'pero', 'por', 'que', 'qué', 'quizás',
  'se', 'sea', 'si', 'sin', 'sino', 'sobre', 'su', 'sus', 'también',
  'tan', 'te', 'todo', 'todos', 'tu', 'tus', 'un', 'una', 'unas', 'unos',
  'y', 'ya', 'yo', 'creo', 'siento', 'siento', 'vez', 'veces', 'sido',
  'puede', 'poder', 'hay', 'bien', 'así', 'ahora', 'cada', 'tanto',
  'porque', 'aunque', 'sería', 'seria', 'ser', 'estar', 'tiene', 'tener',
  'hacer', 'hacer', 'hacia', 'poco', 'mucho', 'muchos', 'muchas', 'gran',
  'mismo', 'misma', 'todo', 'toda', 'todas', 'dia', 'día', 'año',
  'parte', 'caso', 'forma', 'nivel', 'tipo',
]);

// Palabras a normalizar (variantes → término canónico)
const NORMALIZE: Record<string, string> = {
  'comunicacion': 'comunicación',
  'comunicaciones': 'comunicación',
  'comunicar': 'comunicación',
  'homeoffice': 'home office',
  'objetivos': 'objetivos',
  'objetivo': 'objetivos',
  'lideres': 'líderes',
  'lider': 'líder',
  'liderazgo': 'liderazgo',
  'equipos': 'equipo',
  'areas': 'áreas',
  'area': 'área',
  'sectores': 'sectores',
  'sector': 'sectores',
  'mejoras': 'mejora',
  'mejora': 'mejora',
  'mejorar': 'mejora',
  'crecimiento': 'crecimiento',
  'crecer': 'crecimiento',
  'motivacion': 'motivación',
  'motivaciones': 'motivación',
  'proceso': 'procesos',
  'procesos': 'procesos',
  'beneficios': 'beneficios',
  'beneficio': 'beneficios',
  'salario': 'salario',
  'sueldos': 'salario',
  'sueldo': 'salario',
  'remuneracion': 'salario',
  'incentivos': 'incentivos',
  'incentivo': 'incentivos',
  'flexibilidad': 'flexibilidad',
  'flexible': 'flexibilidad',
  'espacio': 'espacio físico',
  'espacios': 'espacio físico',
  'confianza': 'confianza',
  'aprendizaje': 'aprendizaje',
  'aprender': 'aprendizaje',
  'aprendiendo': 'aprendizaje',
  'empatia': 'empatía',
  'compañerismo': 'compañerismo',
  'companerismo': 'compañerismo',
  'claridad': 'claridad',
  'claro': 'claridad',
  'claros': 'claridad',
  'responsabilidades': 'responsabilidades',
  'responsabilidad': 'responsabilidades',
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')                         // descomponer tildes
    .replace(/[\u0300-\u036f]/g, '')          // quitar diacríticos para comparar
    .replace(/[^a-záéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
}

function normalize(word: string): string {
  return NORMALIZE[word] ?? word;
}

/**
 * Genera frecuencias de palabras a partir de un array de comentarios.
 * Filtra stopwords, normaliza variantes y ordena por frecuencia descendente.
 */
export function buildWordFrequencies(comments: SurveyComment[]): WordFrequency[] {
  const freq = new Map<string, number>();

  for (const comment of comments) {
    const tokens = tokenize(comment.text);
    for (const raw of tokens) {
      const word = normalize(raw);
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .filter(({ count }) => count >= 2)        // descartar hapax
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);                             // top 60 para el cloud
}

/**
 * Calcula el fontSize relativo para cada palabra en el cloud.
 * Rango: minPx..maxPx
 */
export function computeFontSize(
  count: number,
  min: number,
  max: number,
  minPx = 12,
  maxPx = 42,
): number {
  if (max === min) return (minPx + maxPx) / 2;
  const ratio = (count - min) / (max - min);
  return Math.round(minPx + ratio * (maxPx - minPx));
}