import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item, (k, v) => {
          // Revive Date objects
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
          }
          return v;
        });
        return parsed;
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (e) {
        console.warn(`Failed to save ${key} to localStorage`, e);
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
