import { useState, useEffect } from 'react';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readFromCache = (key, defaultValue) => {
  if (!isBrowser) {
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.warn(`Failed to parse cached value for ${key}:`, error);
  }

  return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
};

const writeToCache = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to persist cached value for ${key}:`, error);
  }
};

const useCachedState = (key, initialValue) => {
  const [state, setState] = useState(() => readFromCache(key, initialValue));

  useEffect(() => {
    writeToCache(key, state);
  }, [key, state]);

  return [state, setState];
};

export default useCachedState;
