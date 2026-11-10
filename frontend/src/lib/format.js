const EUR = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatta un importo in euro con separatore italiano: 1234.5 -> "1.234,50" */
export function formatCurrency(value) {
  const numeric = Number(value);
  return EUR.format(Number.isFinite(numeric) ? numeric : 0);
}

/** Interpreta input utente con virgola o punto: "1.234,50" -> 1234.5 */
export function parseAmount(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  const cleaned = String(raw)
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const numeric = Number.parseFloat(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Data ISO (YYYY-MM-DD) -> gg/mm/aaaa. Accetta già formati italiani. */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const parts = String(isoDate).split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return String(isoDate);
}

/** Data di oggi in formato YYYY-MM-DD (per <input type="date">). */
export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Quantità leggibile: 2 -> "2", 2.5 -> "2,5" */
export function formatQty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return numeric.toLocaleString('it-IT', { maximumFractionDigits: 3 });
}
