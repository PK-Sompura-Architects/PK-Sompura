// Where the API lives, decided once.
//
// In production the site is served behind a proxy that forwards /api and
// /admin to the backend (see frontend/vercel.json), so a relative base is
// correct and avoids a CORS preflight. Only local development needs an
// absolute origin, and VITE_API_BASE_URL overrides both when a deploy talks to
// a backend on a different host.
//
// The production fallback must never be localhost: VITE_* values are inlined
// at build time, so an unset variable would otherwise ship a bundle that calls
// the visitor's own machine.
export const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:8000" : "");
