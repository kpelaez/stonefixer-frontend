// Word cloud puro en SVG — sin librerías externas.
// Usa un layout de espiral simple para distribuir las palabras.

import { useMemo } from 'react';
import type { WordFrequency } from '../../types/hrSurvey';
import { computeFontSize } from '../../utils/textAnalysis';

interface Props {
  words: WordFrequency[];
  width?: number;
  height?: number;
  onWordClick?: (word: string) => void;
}

// Paleta fija — colores Tailwind en hex para SVG
const COLORS = [
  '#059669', // emerald-600
  '#0284c7', // sky-600
  '#7c3aed', // violet-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#0891b2', // cyan-600
  '#9333ea', // purple-600
  '#16a34a', // green-600
  '#ea580c', // orange-600
  '#2563eb', // blue-600
];

/**
 * Layout en espiral de Arquímedes.
 * Coloca palabras una a una verificando colisión con AABBs ya colocadas.
 * Para ~60 palabras es instantáneo.
 */
function spiralLayout(
  words: { word: string; fontSize: number }[],
  W: number,
  H: number,
): { word: string; x: number; y: number; fontSize: number; color: string }[] {
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const result: { word: string; x: number; y: number; fontSize: number; color: string }[] = [];

  const cx = W / 2;
  const cy = H / 2;

  for (let i = 0; i < words.length; i++) {
    const { word, fontSize } = words[i];
    // Estimación de AABB basada en tamaño de fuente
    const charW = fontSize * 0.55;
    const bw = word.length * charW;
    const bh = fontSize * 1.2;

    let placed_ = false;
    let t = 0;
    const step = 0.35;
    const a = 3.5;

    while (t < 1200) {
      const r = a * t * step;
      const x = cx + r * Math.cos(t * step) - bw / 2;
      const y = cy + r * Math.sin(t * step) - bh / 2;

      // Verificar que esté dentro del canvas
      if (x < 4 || x + bw > W - 4 || y < 4 || y + bh > H - 4) {
        t++;
        continue;
      }

      // Verificar colisión con palabras ya colocadas (AABB padding 4px)
      const pad = 4;
      const collides = placed.some(
        p =>
          x < p.x + p.w + pad &&
          x + bw + pad > p.x &&
          y < p.y + p.h + pad &&
          y + bh + pad > p.y,
      );

      if (!collides) {
        placed.push({ x, y, w: bw, h: bh });
        result.push({
          word,
          x: x + bw / 2,
          y: y + bh / 2,
          fontSize,
          color: COLORS[i % COLORS.length],
        });
        placed_ = true;
        break;
      }
      t++;
    }

    // Si no entró, la descartamos silenciosamente
    if (!placed_) continue;
  }

  return result;
}

export default function WordCloud({
  words,
  width = 640,
  height = 320,
  onWordClick,
}: Props) {
  const laid = useMemo(() => {
    if (!words.length) return [];
    const counts = words.map(w => w.count);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const sized = words.map(w => ({
      word: w.word,
      fontSize: computeFontSize(w.count, min, max, 12, 38),
    }));
    return spiralLayout(sized, width, height);
  }, [words, width, height]);

  if (!laid.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Sin palabras suficientes para mostrar el cloud.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      aria-label="Word cloud de términos más frecuentes en los comentarios"
      role="img"
    >
      {laid.map(({ word, x, y, fontSize, color }) => (
        <text
          key={word}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fill={color}
          fontWeight={fontSize > 26 ? 600 : 400}
          style={{
            cursor: onWordClick ? 'pointer' : 'default',
            userSelect: 'none',
            fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}
          onClick={() => onWordClick?.(word)}
          onMouseEnter={e => ((e.target as SVGTextElement).style.opacity = '0.7')}
          onMouseLeave={e => ((e.target as SVGTextElement).style.opacity = '1')}
        >
          {word}
        </text>
      ))}
    </svg>
  );
}