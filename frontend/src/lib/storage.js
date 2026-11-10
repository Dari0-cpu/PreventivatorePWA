const KEYS = {
  draft: 'pv:draft:v1',
  clients: 'pv:clients:v1',
  issuer: 'pv:issuer:v1',
};

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Bozza corrente: salvata in automatico a ogni modifica. */
export function loadDraft() {
  return readJson(KEYS.draft, null);
}

export function saveDraft(quote) {
  return writeJson(KEYS.draft, quote);
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEYS.draft);
  } catch {
    /* storage non disponibile: nessun danno */
  }
}

/** Dati dell'emittente: si compilano una volta e restano. */
export function loadIssuer() {
  return readJson(KEYS.issuer, null);
}

export function saveIssuer(issuer) {
  return writeJson(KEYS.issuer, issuer);
}

/** Rubrica clienti: solo un extra per riempire i campi più in fretta. */
export function loadClients() {
  const list = readJson(KEYS.clients, []);
  return Array.isArray(list) ? list : [];
}

export function saveClientToDirectory(client) {
  const name = (client.name || '').trim();
  if (!name) return loadClients();

  const key = name.toLowerCase();
  const existing = loadClients().filter((item) => (item.name || '').trim().toLowerCase() !== key);
  const next = [{ ...client, name }, ...existing].slice(0, 50);
  writeJson(KEYS.clients, next);
  return next;
}

export function removeClientFromDirectory(name) {
  const key = (name || '').trim().toLowerCase();
  const next = loadClients().filter((item) => (item.name || '').trim().toLowerCase() !== key);
  writeJson(KEYS.clients, next);
  return next;
}

export function clearClientsDirectory() {
  writeJson(KEYS.clients, []);
  return [];
}
