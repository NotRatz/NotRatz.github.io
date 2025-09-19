const listeners = new Map();

export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
  return () => off(event, callback);
}

export function off(event, callback) {
  const set = listeners.get(event);
  if (!set) return;
  set.delete(callback);
  if (set.size === 0) {
    listeners.delete(event);
  }
}

export function emit(event, detail) {
  const set = listeners.get(event);
  if (!set) return;
  for (const callback of Array.from(set)) {
    try {
      callback(detail);
    } catch (error) {
      console.error('[event-bus]', error);
    }
  }
}

export function once(event, callback) {
  const dispose = on(event, (detail) => {
    dispose();
    callback(detail);
  });
  return dispose;
}
