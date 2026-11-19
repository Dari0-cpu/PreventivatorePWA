import React from 'react';
import { formatCurrency } from '../lib/format';

/** Barra fissa in basso nella vista editor: riepilogo importi e azione rapida PDF. */
export function TotalsBar({ totals, onPrint, onOpenPreview, savedAt }) {
  const savedLabel = savedAt
    ? `Bozza salvata alle ${savedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
    : 'Bozza non ancora salvata';

  return (
    <div className="tp-totals no-print">
      <div className="tp-totals-inner">
        <div className="totals-metric totals-hide-sm">
          <span className="small muted">{savedLabel}</span>
        </div>

        {totals.optionsTotal > 0 ? (
          <div className="totals-metric totals-hide-sm">
            <span className="eyebrow">Opzioni escluse</span>
            <span className="amount">€ {formatCurrency(totals.optionsTotal)}</span>
          </div>
        ) : null}

        <div className="totals-grand">
          <span className="eyebrow">Totale preventivo</span>
          <span className="amount">€ {formatCurrency(totals.total)}</span>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm preview-mobile-trigger"
          onClick={onOpenPreview}
        >
          Anteprima
        </button>
        <button type="button" className="btn btn-primary" onClick={onPrint}>
          Stampa / PDF
        </button>
      </div>
    </div>
  );
}