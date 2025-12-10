const isBrowser = typeof window !== 'undefined';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const getCachedItem = (key, fallback = null) => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = safeParse(raw);
    return parsed ?? fallback;
  } catch (error) {
    return fallback;
  }
};

export const setCachedItem = (key, value) => {
  if (!isBrowser) return;
  try {
    const payload = JSON.stringify({ ...value, cachedAt: Date.now() });
    window.localStorage.setItem(key, payload);
  } catch (error) {
  }
};

export const removeCachedItem = (key) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
  }
};
