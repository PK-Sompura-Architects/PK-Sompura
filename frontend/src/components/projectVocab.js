/**
 * The shared vocabulary for project status and category.
 *
 * Its own module rather than exports from IndiaMap, for two reasons: exporting
 * constants alongside a component breaks fast refresh, and a static import of
 * IndiaMap from the Projects page cancelled its `React.lazy` split, folding the
 * whole map into the page's chunk.
 *
 * Status sets marker colour, category sets marker shape. Both are always
 * spelled out in words in the legend and the text list, so neither is ever
 * carried by colour alone.
 */

export const STATUS = {
    completed:   { label: 'Completed',   className: 'is-completed' },
    in_progress: { label: 'In progress', className: 'is-progress' },
    planned:     { label: 'Planned',     className: 'is-planned' },
};

export const CATEGORY = {
    mountain: { label: 'Artificial mountain temple' },
    stone:    { label: 'Stone temple' },
};

/** Sentinel for "no filter". A plain empty string would collide with a real
 *  but unrecorded value. */
export const ALL = '__all__';
