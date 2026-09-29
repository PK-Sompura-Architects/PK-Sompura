import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// The Temple Register. [A4] Sample data until the client's list arrives (see src/data/projects.json).
// A photo without `src` is still missing and renders as a labelled placeholder.
const projects = defineCollection({
  loader: file('src/data/projects.json'),
  schema: z.object({
    no: z.number(),
    name: z.string(),
    place: z.string(), // '' = place not yet confirmed
    state: z.string(),
    type: z.string(),
    scope: z.array(z.enum(['Design', 'Hand carving', 'CNC', 'Construction', 'Fero / mountain'])),
    photos: z.array(z.object({ label: z.string(), caption: z.string().optional(), src: z.string().optional() })),
    note: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { projects };
