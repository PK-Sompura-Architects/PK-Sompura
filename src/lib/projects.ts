import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export const SCOPES = ['Design', 'Hand carving', 'CNC', 'Construction', 'Fero / mountain'] as const;

export const placeFull = (p: Project['data']) => (p.place ? `${p.place}, ${p.state}` : 'Place to confirm');
export const pad = (n: number) => String(n).padStart(2, '0');

// The register's default order: place A–Z, then name. Never by date.
export const byPlace = (a: Project, b: Project) =>
  placeFull(a.data).localeCompare(placeFull(b.data)) || a.data.name.localeCompare(b.data.name);

export async function sortedProjects() {
  return (await getCollection('projects')).sort(byPlace);
}
