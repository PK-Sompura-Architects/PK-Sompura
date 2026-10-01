// Photos exported by tools/photos/export.py (AVIF + WebP at 480/720/960/1600/2400, never wider than the source).
import media from '../data/media.json';

export type Media = { avif: string; webp: string; src: string; w: number; h: number; alt: string };
const all = media as Record<string, { w: number; h: number; widths: number[]; alt: string }>;

export function mediaSet(id?: string): Media | null {
  const m = id ? all[id] : undefined;
  if (!m) return null;
  const set = (ext: string) => m.widths.map((w) => `/media/${id}-${w}.${ext} ${w}w`).join(', ');
  return { avif: set('avif'), webp: set('webp'), src: `/media/${id}-${m.widths.includes(960) ? 960 : m.widths.at(-1)}.webp`, w: m.w, h: m.h, alt: m.alt };
}
