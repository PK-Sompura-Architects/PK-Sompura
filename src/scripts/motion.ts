// Loads the motion layer after the page has loaded and is idle. Nothing loads under prefers-reduced-motion: the page is
// complete as HTML and CSS, and every effect's resting state is its reduced-motion state.
import { afterLoad } from './after-load';
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) afterLoad(() => import('./motion-main'));
