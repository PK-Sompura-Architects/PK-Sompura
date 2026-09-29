// Loads the motion layer after the page is idle. Nothing loads under prefers-reduced-motion: the page is
// complete as HTML and CSS, and every effect's resting state is its reduced-motion state.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const go = () => import('./motion-main');
  'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 1200);
}
