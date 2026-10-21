import { useEffect, useRef } from 'react';
const handlers = new Map<symbol, { priority: number; run: () => boolean }>();
export function handleBack() {
  for (const handler of [...handlers.values()].sort((a,b) => b.priority - a.priority)) {
    if (handler.run()) return true;
  }
  return false;
}
export function useBackHandler(run: () => boolean, priority = 0) {
  const latest = useRef(run);
  latest.current = run;
  useEffect(() => {
    const id = Symbol(); handlers.set(id, { priority, run: () => latest.current() });
    return () => { handlers.delete(id); };
  }, [priority]);
}
export function useDialog(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const latestClose = useRef(close); latestClose.current = close;
  useBackHandler(() => { if (!open) return false; latestClose.current(); return true; }, 100);
  useEffect(() => {
    if (!open || !ref.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const selector = 'button:not(:disabled), input, select, textarea, a[href], [tabindex="0"]';
    (dialog.querySelector<HTMLElement>(selector) || dialog).focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll<HTMLElement>(selector)].filter(el => el.getClientRects().length > 0);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length-1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', trap);
    return () => { dialog.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}
