/* Memória exclusiva de cada demonstração; não altera preferências do app do usuário. */
(() => {
  if (window === window.parent) return;
  const memoryStorage = () => {
    const values = new Map();
    return {
      getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
      setItem(key, value) { values.set(String(key), String(value)); },
      removeItem(key) { values.delete(String(key)); },
      clear() { values.clear(); },
      key(index) { return [...values.keys()][index] ?? null; },
      get length() { return values.size; },
    };
  };
  for (const key of ['localStorage', 'sessionStorage']) {
    try { Object.defineProperty(window,key,{configurable:true,value:memoryStorage()}); }
    catch (_) { /* O sandbox sem mesma origem também bloqueia o armazenamento principal. */ }
  }
})();
