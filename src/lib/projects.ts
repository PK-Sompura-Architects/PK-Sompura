import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export const SCOPES = ['Design', 'Hand carving', 'CNC', 'Construction', 'Fero / mountain'] as const;

// '' when the place isn't known: callers hide the place line rather than showing a placeholder.
export const placeFull = (p: Project['data']) => (p.place ? `${p.place}, ${p.state}` : '');
export const placeType = (p: Project['data']) => [placeFull(p), p.type].filter(Boolean).join(' · ');
export const pad = (n: number) => String(n).padStart(2, '0');

// The register's default order: place A–Z (unknown places last), then name. Never by date.
const placeSort = (p: Project['data']) => placeFull(p) || '￿';
export const byPlace = (a: Project, b: Project) =>
  placeSort(a.data).localeCompare(placeSort(b.data)) || a.data.name.localeCompare(b.data.name);

export async function sortedProjects() {
  return (await getCollection('projects')).sort(byPlace);
}
