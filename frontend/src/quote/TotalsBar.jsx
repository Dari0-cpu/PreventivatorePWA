import React from 'react';
import { formatCurrency } from '../lib/format';

/** Barra fissa in basso: totale scritto a mano, sempre in vista. */
export function TotalsBar({ totals, onPrint, onOpenPreview, savedAt }) {
  const savedLabel = savedAt
    ? `Salvato ${savedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
    : 'Bozza vuota';

  return (
    <div className="tp-totals no-print">
      <div className="tp-totals-inner">
        {totals.optionsTotal > 0 ? (
          <div className="totals-metric totals-hide-sm">
            <span className="eyebrow">Opzioni escluse</span>
            <span className="amount">€ {formatCurrency(totals.optionsTotal)}</span>
          </div>
        ) : null}

        <div className="totals-grand">
          <span className="eyebrow">Totale preventivo</span>
          <span className="amount">€ {formatCurrency(totals.total)}</span>
          <span className="small muted" style={{ fontSize: 10.5 }}>{savedLabel}</span>
        </div>

        <button type="button" className="btn btn-ghost btn-sm preview-mobile-trigger" onClick={onOpenPreview}>
          Anteprima
        </button>
        <button type="button" className="btn btn-primary" onClick={onPrint}>
          Genera PDF
        </button>
      </div>
    </div>
  );
}
