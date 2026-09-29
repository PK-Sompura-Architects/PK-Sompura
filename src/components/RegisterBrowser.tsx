import { useEffect, useMemo, useRef, useState } from 'react';

// The Temple Register: filter bar + list (Board 02). Server-rendered in full, so with JS off every entry shows;
// the filter controls become visible once hydrated. State mirrors the URL: ?place=&scope=&sort=
// Filters: one place AND any of the chosen scopes (OR within scope). Sort: place or type A–Z, never by date.

export const SCOPES = ['Design', 'Hand carving', 'CNC', 'Construction', 'Fero / mountain'] as const;
type Scope = (typeof SCOPES)[number];
type Sort = 'place' | 'type';

export interface Entry {
  id: string;
  no: number;
  name: string;
  placeFull: string;
  placeKey: string; // URL value, e.g. "tharad"
  type: string;
  scope: Scope[];
  lead?: string; // label of the first photo, if the project has any
}

const scopeKey = (s: Scope) => (s === 'Fero / mountain' ? 'fero' : s.toLowerCase().replace(/\s+/g, '-'));
const pad = (n: number) => String(n).padStart(2, '0');
const byPlace = (a: Entry, b: Entry) => a.placeFull.localeCompare(b.placeFull) || a.name.localeCompare(b.name);
const byType = (a: Entry, b: Entry) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
const COLS = 'grid-cols-[48px_minmax(0,1fr)_200px_132px_32px] xl:grid-cols-[56px_minmax(0,1fr)_220px_180px_132px_64px_32px]';

function readUrl(entries: Entry[]) {
  const q = new URLSearchParams(location.search);
  const place = entries.find((e) => e.placeKey === q.get('place'))?.placeFull ?? 'All';
  const keys = (q.get('scope') ?? '').split(',');
  const scopes = SCOPES.filter((s) => keys.includes(scopeKey(s)));
  const sort: Sort = q.get('sort') === 'type' ? 'type' : 'place';
  return { place, scopes, sort };
}

export default function RegisterBrowser({ entries }: { entries: Entry[] }) {
  const [ready, setReady] = useState(false);
  const [place, setPlace] = useState('All');
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [sort, setSort] = useState<Sort>('place');
  const sheet = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const s = readUrl(entries);
    setPlace(s.place);
    setScopes(s.scopes);
    setSort(s.sort);
    setReady(true);
  }, []);

  // Mirror state into the URL (replace, so filtering doesn't flood the back button).
  useEffect(() => {
    if (!ready) return;
    // Built by hand so the scope list keeps readable commas (?scope=cnc,fero); all keys are URL-safe slugs.
    const q: string[] = [];
    if (place !== 'All') q.push(`place=${entries.find((e) => e.placeFull === place)!.placeKey}`);
    if (scopes.length) q.push(`scope=${scopes.map(scopeKey).join(',')}`);
    if (sort !== 'place') q.push(`sort=${sort}`);
    const qs = q.join('&');
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }, [ready, place, scopes, sort]);

  const places = useMemo(() => [...new Set(entries.map((e) => e.placeFull))].sort(), [entries]);
  const rows = useMemo(
    () => entries
      .filter((e) => (place === 'All' || e.placeFull === place) && (!scopes.length || e.scope.some((s) => scopes.includes(s))))
      .sort(sort === 'type' ? byType : byPlace),
    [entries, place, scopes, sort],
  );

  const toggle = (s: Scope) => setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : SCOPES.filter((x) => x === s || cur.includes(x))));
  const clear = () => { setPlace('All'); setScopes([]); };
  const hasFilters = place !== 'All' || scopes.length > 0;
  const filterCount = (place !== 'All' ? 1 : 0) + scopes.length;
  const where = [place !== 'All' ? place : null, scopes.length ? scopes.join(' or ') : null].filter(Boolean).join(' with ');
  const count = `Showing ${rows.length} of ${entries.length} entries · over 51 projects completed`;

  const chip = (s: Scope, mobile = false) => {
    const on = scopes.includes(s);
    return (
      <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)}
        className={`flex items-center gap-2 whitespace-nowrap border border-navy px-3.5 font-mono text-[12px] font-medium uppercase tracking-[.06em] transition-colors duration-150
          ${mobile ? 'h-11' : 'h-10'} ${on ? 'bg-navy text-sand' : 'text-navy hover:bg-stone'}`}>
        {s}{on && <span aria-hidden="true">×</span>}
      </button>
    );
  };
  const placeSelect = (id: string, mobile = false) => (
    <select id={id} value={place} onChange={(e) => setPlace(e.target.value)}
      className={`rounded-none border border-navy bg-sand font-mono text-navy ${mobile ? 'h-12 w-full px-3 text-[14px]' : 'h-11 pl-3.5 pr-9 text-[13px]'}`}>
      <option value="All">All places</option>
      {places.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );

  return (
    <>
      {/* Desktop filter bar */}
      <div className={`flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-slate border-t border-t-navy py-5 max-lg:hidden ${ready ? '' : 'invisible'}`}>
        <div className="flex items-center gap-3">
          <label htmlFor="f-place" className="eyebrow !text-[12px]">Place</label>
          {placeSelect('f-place')}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="f-scope">
          <span id="f-scope" className="eyebrow mr-1 !text-[12px]">Scope</span>
          {SCOPES.map((s) => chip(s))}
        </div>
        <div className="ml-auto flex items-center gap-2" role="group" aria-labelledby="f-sort">
          <span id="f-sort" className="eyebrow !text-[12px]">Sort</span>
          {(['place', 'type'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}
              className={`h-10 border-b-2 px-3 font-mono text-[12px] font-medium uppercase tracking-[.06em] ${sort === k ? 'border-navy' : 'border-transparent'}`}>
              By {k}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile controls */}
      <div className={`grid grid-cols-2 gap-2 lg:hidden ${ready ? '' : 'invisible'}`}>
        <button type="button" onClick={() => sheet.current?.showModal()} aria-haspopup="dialog"
          className="h-12 border border-navy bg-navy font-mono text-[12px] font-medium uppercase tracking-[.06em] text-sand">
          Filter · {filterCount}
        </button>
        <button type="button" onClick={() => setSort(sort === 'type' ? 'place' : 'type')}
          className="h-12 border border-navy font-mono text-[12px] font-medium uppercase tracking-[.06em]">
          Sort: {sort === 'type' ? 'Type' : 'Place'}
        </button>
      </div>

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-navy py-3 font-mono text-[12px] text-slate-deep lg:border-b-0 lg:py-3.5 lg:text-[13px]">
        <span aria-live="polite">{count}</span>
        <span className="ml-auto max-lg:hidden">Scope marks, left to right: Design · Hand carving · CNC · Construction · Fero</span>
        {ready && hasFilters && <button type="button" onClick={clear} className="text-navy underline underline-offset-4 hover:text-saffron-text max-lg:hidden">Clear filters</button>}
      </div>

      {rows.length === 0 && <Empty where={where} onClear={clear} scopes={scopes} placeSet={place !== 'All'} onShowScope={() => setPlace('All')} />}

      {/* Desktop list: each row is one link. The band is Flowing Menu's reduced-motion state; phase 4 adds the slide and loop. */}
      <div className="max-lg:hidden">
        {rows.length > 0 && (
          <div className={`grid ${COLS} gap-x-6 border-b border-navy py-2.5 font-mono text-[11px] font-medium uppercase tracking-[.08em] text-slate-deep`} aria-hidden="true">
            <span>No.</span><span>Name</span><span>Place</span><span className="max-xl:hidden">Type</span><span>Scope</span><span className="max-xl:hidden">Photo</span><span />
          </div>
        )}
        <ol>
          {rows.map((e) => (
            <li key={e.id}>
              <a href={`/projects/${e.id}`} className="register-row group relative block h-24 overflow-hidden border-b border-slate focus-visible:outline-none">
                <span className={`absolute inset-0 grid ${COLS} items-center gap-x-6`}>
                  <span className="font-mono text-[13px] text-slate-deep">{pad(e.no)}</span>
                  <span className="truncate font-display text-title">{e.name}</span>
                  <span className="font-mono text-[14px]">{e.placeFull}</span>
                  <span className="font-mono text-[14px] text-slate-deep max-xl:hidden">{e.type}</span>
                  <span className="flex gap-1.5" aria-hidden="true">
                    {SCOPES.map((s) => <span key={s} className={`h-3 w-3 border ${e.scope.includes(s) ? 'border-navy bg-navy' : 'border-slate'}`} />)}
                  </span>
                  <span className="font-mono text-[13px] text-slate-deep max-xl:hidden">{e.lead ? 'Photo' : '—'}</span>
                  <span className="text-right text-[20px]" aria-hidden="true">→</span>
                  <span className="sr-only">{e.type}. Scope: {e.scope.join(', ')}.{e.lead ? '' : ' No photographs yet.'}</span>
                </span>
                <span className="band absolute inset-0 hidden items-center gap-7 whitespace-nowrap bg-navy pl-20 group-hover:flex group-focus-visible:flex" aria-hidden="true">
                  <span className="font-display text-title text-sand">{e.name}</span>
                  <Diamond />
                  <span className="font-mono text-[14px] text-sky">{e.placeFull}</span>
                  {e.lead && <span className="ph-night h-[72px] w-14 flex-none rounded-t-full border border-sky" />}
                  <span className="font-mono text-[14px] text-sky">{e.type}</span>
                  <Diamond />
                  <span className="font-mono text-[14px] uppercase tracking-[.06em] text-sand">{e.scope.join(' · ')}</span>
                  <Diamond />
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Mobile list: tap a row to expand it (native <details>; phase 4 adds the height animation). */}
      <ol className="lg:hidden">
        {rows.map((e) => (
          <li key={e.id} className="border-b border-slate">
            <details className="group">
              <summary className="flex min-h-[76px] cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="w-6 flex-none font-mono text-[12px] text-slate-deep">{pad(e.no)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-display text-[24px] leading-[1.1]">{e.name}</span>
                  <span className="font-mono text-[12px] text-slate-deep">{e.placeFull}</span>
                </span>
                <span className="flex h-11 w-11 flex-none items-center justify-center font-mono text-[22px]" aria-hidden="true">
                  <span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <div className="flex flex-col gap-4 pb-6">
                {e.lead ? (
                  <>
                    <div className="ph-light relative h-[340px] overflow-hidden rounded-t-full">
                      <span className="absolute bottom-3 left-3 right-3 w-fit border border-navy bg-sand px-2 py-1.5 font-mono text-[12px] leading-snug">PHOTO · {e.name}{e.placeKey !== 'to-confirm' ? `, ${e.placeFull.split(',')[0]}` : ''}</span>
                    </div>
                    <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 font-mono text-[12px] leading-normal">
                      <dt className="uppercase tracking-[.08em] text-slate-deep">Type</dt><dd>{e.type}</dd>
                      <dt className="uppercase tracking-[.08em] text-slate-deep">Scope</dt><dd>{e.scope.join(' · ')}</dd>
                    </dl>
                  </>
                ) : (
                  <TypeCardRow e={e} />
                )}
                <a href={`/projects/${e.id}`} className="flex h-12 items-center justify-between border border-navy px-4 text-[15px] font-medium">Open project<span aria-hidden="true">→</span></a>
              </div>
            </details>
          </li>
        ))}
      </ol>

      {/* Mobile filter sheet: modal dialog (focus contained, Esc closes), Done closes. */}
      <dialog ref={sheet} aria-labelledby="sheet-title"
        className="m-0 mt-auto w-full max-w-none border-t border-navy bg-sand p-5 text-navy shadow-sheet backdrop:bg-night/30 lg:hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="sheet-title" className="font-display text-[28px]">Filter</h2>
            <button type="button" onClick={() => sheet.current?.close()} className="h-11 border border-navy px-3 font-mono text-[12px] uppercase tracking-[.06em]">Done</button>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="s-place" className="eyebrow !text-[12px]">Place</label>
            {placeSelect('s-place', true)}
          </div>
          <div className="flex flex-col gap-2" role="group" aria-labelledby="s-scope">
            <span id="s-scope" className="eyebrow !text-[12px]">Scope</span>
            <div className="flex flex-wrap gap-2">{SCOPES.map((s) => chip(s, true))}</div>
          </div>
          <p className="font-mono text-[12px] text-slate-deep" aria-live="polite">{count}</p>
        </div>
      </dialog>
    </>
  );
}

function Diamond() {
  return <span className="h-[9px] w-[9px] flex-none rotate-45 bg-saffron" />;
}

function Dentils({ count, size }: { count: number; size: number }) {
  return (
    <div className="flex justify-between" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <span key={i} className="bg-stone shadow-relief" style={{ width: size, height: size }} />)}
    </div>
  );
}

// Same tablet as TypeCard.astro (size "row"), for entries without photos.
function TypeCardRow({ e }: { e: Entry }) {
  return (
    <div className="flex flex-col gap-4 bg-stone bg-stone-tex px-5 py-6 shadow-tablet">
      <div className="flex justify-between font-mono text-[12px] uppercase tracking-[.08em]"><span>Register entry</span><span>No. {pad(e.no)}</span></div>
      <p className="text-cut font-display text-[40px] leading-none">{e.name}</p>
      <p className="font-mono text-[13px]">{e.placeFull} · {e.type}</p>
      <div className="flex flex-wrap gap-1.5">
        {e.scope.map((s) => <span key={s} className="inline-block whitespace-nowrap border border-navy px-2 py-1 font-mono text-[11px] font-medium uppercase leading-none tracking-[.08em]">{s}</span>)}
      </div>
      <div className="border-t border-slate-deep pt-2"><Dentils count={12} size={10} /></div>
    </div>
  );
}

function Empty({ where, onClear, scopes, placeSet, onShowScope }: {
  where: string; onClear: () => void; scopes: Scope[]; placeSet: boolean; onShowScope: () => void;
}) {
  // The secondary action keeps the scope and drops the place, so it always has results.
  const showScope = placeSet && scopes.length > 0;
  return (
    <div className="mt-5 flex flex-col gap-3.5 bg-stone bg-stone-tex px-5 py-7 lg:mt-6 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:px-16 lg:py-18">
      <div className="flex flex-col items-start gap-3.5 lg:col-span-7 lg:gap-5">
        <h2 className="text-cut font-display text-[32px] leading-[1.05] lg:text-[56px] lg:leading-[1.02]">Nothing in the register matches.</h2>
        <p className="text-[15px] leading-[1.55] lg:max-w-[560px] lg:text-[18px] lg:leading-[1.6]">
          No entries for {where}.<span className="max-lg:hidden"> The register lists the documented projects; over 51 are completed.</span>
        </p>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:gap-6">
          <button type="button" onClick={onClear} className="btn-primary h-12 text-[15px]">Clear filters</button>
          {showScope && (
            <button type="button" onClick={onShowScope} className="btn-secondary h-12 text-[15px] lg:h-auto lg:border-0 lg:px-0 lg:underline lg:underline-offset-[5px] lg:hover:bg-transparent lg:hover:text-saffron-text">
              Show all {scopes.join(' or ')}<span className="max-lg:hidden"> entries</span>
            </button>
          )}
        </div>
      </div>
      <div className="max-lg:hidden lg:col-span-4 lg:col-start-9 lg:self-end"><Dentils count={7} size={14} /></div>
    </div>
  );
}
