"use client";

import * as React from "react";

const STORAGE_KEY = "imets_orientation_progress_v1";

/**
 * Completed orientation modules, backed by `localStorage`.
 *
 * Kept on the device rather than the server on purpose: this is a training aid,
 * not a compliance record. Nobody is assessed on it, so it does not warrant a
 * table, an endpoint, or a row tying a named employee to the score they got on
 * a practice quiz. If it ever becomes something HR signs off, that is a
 * different feature with a different data model.
 *
 * `localStorage` is an external store, so it is read through
 * `useSyncExternalStore` rather than an effect. That gives a correct empty
 * snapshot during SSR (no hydration mismatch), keeps two tabs in step via the
 * `storage` event, and avoids the cascading render an effect-then-setState
 * would cause.
 */

const EMPTY: ReadonlySet<string> = new Set();

/**
 * The live snapshot. `useSyncExternalStore` compares snapshots by identity, so
 * this reference must change only when the stored value actually changes —
 * building a fresh Set on every read would loop forever.
 */
let snapshot: ReadonlySet<string> = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function readStorage(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    // Private mode, blocked storage, corrupt JSON — start clean rather than
    // breaking the page over a progress tick.
    return EMPTY;
  }
}

function getSnapshot(): ReadonlySet<string> {
  if (!hydrated) {
    snapshot = readStorage();
    hydrated = true;
  }
  return snapshot;
}

/** Server render — nothing is complete until the client says otherwise. */
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    hydrated = false;
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: ReadonlySet<string>) {
  snapshot = next;
  hydrated = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // Progress will not survive a reload; the page still works.
  }
  emit();
}

export function useOrientationProgress(total: number) {
  const done = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const complete = React.useCallback((id: string) => {
    if (getSnapshot().has(id)) return;
    write(new Set(getSnapshot()).add(id));
  }, []);

  const reset = React.useCallback(() => write(EMPTY), []);

  return {
    done,
    complete,
    reset,
    count: done.size,
    total,
    percent: total > 0 ? Math.round((done.size / total) * 100) : 0,
    allDone: done.size >= total,
  };
}
