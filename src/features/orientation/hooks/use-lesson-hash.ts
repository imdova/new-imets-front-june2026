"use client";

import * as React from "react";

/**
 * The current lesson, held in the URL fragment (`…/orientation#practice`).
 *
 * Keeping it in the URL rather than component state buys three things a course
 * needs: the browser Back button steps back through lessons, a manager can send
 * "start at #practice" as a link, and a refresh does not dump the learner at
 * lesson one.
 *
 * The fragment is an external store, so it is read through
 * `useSyncExternalStore`. That gives a defined server snapshot (empty, since
 * the server never sees a fragment) and avoids the effect-then-setState pattern
 * that would cascade a second render on every navigation.
 */

const listeners = new Set<() => void>();

function currentHash(): string {
  return typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}

/** The server never receives the fragment, so it always renders the default. */
function getServerSnapshot(): string {
  return "";
}

export function useLessonHash() {
  const hash = React.useSyncExternalStore(subscribe, currentHash, getServerSnapshot);

  const go = React.useCallback((id: string) => {
    if (currentHash() === id) return;
    /*
     * `pushState` rather than assigning `location.hash`: assigning it makes the
     * browser scroll to any element with that id, and every lesson id is also a
     * section id here. It fires no `hashchange` either, hence the manual
     * notify below.
     */
    window.history.pushState(null, "", `#${id}`);
    listeners.forEach((l) => l());
  }, []);

  /**
   * Write the lesson into the URL *without* adding a history entry.
   *
   * Needed because the lesson shown when the fragment is empty is derived from
   * stored progress — so finishing that lesson would change the derivation and
   * silently slide the learner onto the next one mid-lesson. Pinning the
   * fragment on completion freezes the view where they are, and leaves a real
   * entry for the Back button to return to.
   */
  const pin = React.useCallback((id: string) => {
    if (currentHash() !== "") return;
    window.history.replaceState(null, "", `#${id}`);
    listeners.forEach((l) => l());
  }, []);

  return { hash, go, pin };
}
