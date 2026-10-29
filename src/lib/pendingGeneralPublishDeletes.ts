import { useSyncExternalStore } from "react";

// Deleting a broadcast removes it from every site and can't be undone, so the
// real DELETE is held back for an undo window. The timers live here, outside
// React, so they keep running if the card unmounts (page change, filter) — and
// if the tab closes inside the window the delete simply never happens.

export const DELETE_UNDO_WINDOW_MS = 8000;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
// Ids hidden from the list: waiting out the window, or with the DELETE in flight.
const hidden = new Set<string>();
let snapshot: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function publish() {
  snapshot = new Set(hidden);
  listeners.forEach((l) => l());
}

export function scheduleDelete(
  id: string,
  opts: { run: () => Promise<void>; onError: (err: unknown) => void; delayMs?: number }
) {
  if (hidden.has(id)) return;
  hidden.add(id);
  publish();

  timers.set(
    id,
    setTimeout(async () => {
      timers.delete(id);
      try {
        await opts.run();
      } catch (err) {
        opts.onError(err);
      } finally {
        hidden.delete(id);
        publish();
      }
    }, opts.delayMs ?? DELETE_UNDO_WINDOW_MS)
  );
}

/** Undo: only possible while the window is open (the DELETE hasn't been sent). */
export function cancelDelete(id: string): boolean {
  const timer = timers.get(id);
  if (!timer) return false;
  clearTimeout(timer);
  timers.delete(id);
  hidden.delete(id);
  publish();
  return true;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: ReadonlySet<string> = new Set();

export function usePendingDeleteIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
