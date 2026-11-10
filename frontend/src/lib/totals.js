import { parseAmount } from './format';

/**
 * Arrotondamento HALF_UP a 2 decimali. L'EPSILON compensa i casi
 * tipo 1.005 * 100 = 100.49999999999999.
 */
export function roundMoney(value) {
  if (!Number.isFinite(value)) return 0;
  const scaled = value * 100;
  const epsilon = Math.abs(scaled) * Number.EPSILON * 4;
  return Math.round(scaled + (scaled >= 0 ? epsilon : -epsilon)) / 100;
}

/**
 * Totali del preventivo: somma degli importi scritti a mano, sezione per sezione.
 * Nessun calcolo d'IVA — la dicitura accanto all'importo la scrive l'utente.
 * Le sezioni marcate come opzione alternativa restano fuori dal totale generale.
 */
export function computeQuoteTotals(sections = []) {
  const bySection = {};
  let total = 0;
  let optionsTotal = 0;

  sections.forEach((section) => {
    const amount = roundMoney(parseAmount(section.amount));
    bySection[section.id] = { amount };
    if (section.is_optional) {
      optionsTotal += amount;
    } else {
      total += amount;
    }
  });

  return {
    total: roundMoney(total),
    optionsTotal: roundMoney(optionsTotal),
    bySection,
  };
}
