import React from 'react';
import { formatCurrency } from '../lib/format';
import { lineTotals } from '../lib/totals';
import { VAT_RATES } from './quoteModel';

/** Singola voce del preventivo: descrizione libera, quantità, prezzo, IVA. */
export function LineRow({ line, index, onChange, onDuplicate, onRemove, canRemove }) {
  const totals = lineTotals(line);

  return (
    <div className="line-row">
      <div className="field line-desc">
        <label className="field-label" htmlFor={`desc-${line.id}`}>
          Descrizione voce {index + 1}
        </label>
        <textarea
          id={`desc-${line.id}`}
          className="textarea"
          rows={2}
          value={line.description}
          placeholder="Es. Fornitura e posa in opera unità esterna modello MU2R17…"
          onChange={(event) => onChange('description', event.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`qty-${line.id}`}>Q.tà</label>
        <input
          id={`qty-${line.id}`}
          className="input amount-input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={line.qty}
          onChange={(event) => onChange('qty', event.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`price-${line.id}`}>Prezzo €</label>
        <input
          id={`price-${line.id}`}
          className="input amount-input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={line.unit_price}
          placeholder="0,00"
          onChange={(event) => onChange('unit_price', event.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`vat-${line.id}`}>IVA</label>
        <select
          id={`vat-${line.id}`}
          className="select"
          value={line.vat_rate}
          onChange={(event) => onChange('vat_rate', Number(event.target.value))}
        >
          {VAT_RATES.map((rate) => (
            <option key={rate} value={rate}>{rate}%</option>
          ))}
        </select>
      </div>

      <div className="field line-net">
        <span className="field-label">Totale</span>
        <span className="amount line-net-value">€ {formatCurrency(totals.net)}</span>
      </div>

      <div className="line-del">
        <button
          type="button"
          className="btn btn-icon"
          onClick={onDuplicate}
          title="Duplica voce"
          aria-label="Duplica voce"
        >
          ⧉
        </button>
        <button
          type="button"
          className="btn btn-icon btn-danger"
          onClick={onRemove}
          disabled={!canRemove}
          title="Elimina voce"
          aria-label="Elimina voce"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
