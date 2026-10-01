// Runs `fn` once the page has finished loading, the first-load loader has gone (html.pk-ld, see Loader.astro) and the
// main thread is idle, so optional JS (motion) never competes with the fonts, CSS and hero image before LCP. Nothing
// it animates is visible while the loader is up anyway.
export function afterLoad(fn: () => void) {
  const root = document.documentElement;
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  const unveiled = () => {
    if (!root.classList.contains('pk-ld')) return idle();
    const mo = new MutationObserver(() => { if (!root.classList.contains('pk-ld')) { mo.disconnect(); idle(); } });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  };
  document.readyState === 'complete' ? unveiled() : addEventListener('load', unveiled, { once: true });
}
