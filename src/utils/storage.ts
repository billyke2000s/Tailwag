import { useSyncExternalStore } from 'react';

type Listener = () => void;
const entries = new Map<string, { value: unknown; listeners: Set<Listener> }>();
const prefix = 'tailwag:v1:';
export function readStored<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(prefix + key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data.version === 1 && valid(data.value) ? data.value : fallback;
  } catch { return fallback; }
}
export function usePersistentState<T>(key: string, fallback: T, valid: (value: unknown) => value is T) {
  if (!entries.has(key)) entries.set(key, { value: readStored(key, fallback, valid), listeners: new Set() });
  const entry = entries.get(key)!;
  const value = useSyncExternalStore(
    (listener) => { entry.listeners.add(listener); return () => { entry.listeners.delete(listener); }; },
    () => entry.value as T,
    () => fallback,
  );
  const set = (next: T | ((previous: T) => T)) => {
    const result = typeof next === 'function' ? (next as (previous: T) => T)(entry.value as T) : next;
    entry.value = result;
    try { localStorage.setItem(prefix + key, JSON.stringify({ version: 1, value: result })); }
    catch { /* Storage may be blocked or full; the current session still works. */ }
    entry.listeners.forEach(listener => listener());
  };
  return [value, set] as const;
}
export const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
export const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
export const isObject = (v: unknown): v is Record<string, any> => v !== null && typeof v === 'object' && !Array.isArray(v);
