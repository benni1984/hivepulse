'use client';

import { useEffect } from 'react';

/**
 * Gives a page behind the login its own browser tab (#438).
 *
 * The dashboard pages are client components, and a client component cannot export
 * `generateMetadata`, so all of them used to show the generic site title: seven open tabs, seven
 * times "HivePulse — Protecting Pollinators Together". No crawler ever sees these pages, so a
 * title set in the browser is all they need, and it costs no new translations — every page is
 * passed the heading it already renders.
 *
 * The four public pages under /dashboard (login, register, forgot-password, reset-password) are a
 * different matter: those get shared as links and need real server-rendered metadata, which they
 * have in a `layout.tsx` beside them, the same way the hornet pages do.
 *
 * There is deliberately no cleanup that restores the previous title. On a client-side navigation
 * Next.js applies the target route's metadata itself, and a restore in between only adds a flicker.
 */
export function useDocumentTitle(title: string | null | undefined, suffix = 'HivePulse') {
  useEffect(() => {
    // A detail page knows its name only after the fetch resolves; until then, leave the tab alone
    // rather than writing "undefined — HivePulse" into it.
    if (!title) return;
    document.title = `${title} — ${suffix}`;
  }, [title, suffix]);
}
