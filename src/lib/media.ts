// Photos exported by tools/photos/export.py (AVIF + WebP at 480/720/960/1600, never wider than the source).
import media from '../data/media.json';

export type Media = { avif: string; webp: string; src: string; w: number; h: number; alt: string };
const all = media as Record<string, { w: number; h: number; widths: number[]; alt: string }>;

export function mediaSet(id?: string): Media | null {
  const m = id ? all[id] : undefined;
  if (!m) return null;
  const set = (ext: string) => m.widths.map((w) => `/media/${id}-${w}.${ext} ${w}w`).join(', ');
  return { avif: set('avif'), webp: set('webp'), src: `/media/${id}-${m.widths.includes(960) ? 960 : m.widths.at(-1)}.webp`, w: m.w, h: m.h, alt: m.alt };
}

// The widest exported WebP of a photo: the lightbox image, and the link target when JavaScript is off.
export const mediaFull = (id: string) => {
  const m = all[id];
  return m ? `/media/${id}-${m.widths.at(-1)}.webp` : '';
};
