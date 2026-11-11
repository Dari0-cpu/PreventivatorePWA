import React from 'react';
import { Panel } from '../components/Panel';
import { TextArea } from '../components/Field';
import { PAYMENT_PRESETS, NOTE_PRESETS } from './quoteModel';

/** Modalità di pagamento, esclusioni e visibilità del totale nel PDF. */
export function TermsPanel({ quote, onChange, onAppend }) {
  return (
    <Panel
      step="05"
      eyebrow="Condizioni"
      title="Pagamento ed esclusioni"
      sub="Se lasci vuoto un campo, non verrà stampato nel preventivo PDF."
    >
      <div className="stack-md">
        <div>
          <label className="check" style={{ marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={Boolean(quote.show_total)}
              onChange={(event) => onChange('show_total', event.target.checked)}
            />
            Mostra il TOTALE complessivo nel preventivo PDF
          </label>
        </div>

        <div>
          <TextArea
            label="Modalità di pagamento"
            value={quote.payment_terms}
            onChange={(value) => onChange('payment_terms', value)}
            rows={3}
            placeholder="Es. 30% all'ordine, saldo fine lavori (lascia vuoto per nascondere)"
          />
          <div className="chip-row" style={{ marginTop: 10 }}>
            {PAYMENT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="chip"
                onClick={() => onAppend('payment_terms', preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <TextArea
            label="Esclusioni"
            value={quote.notes}
            onChange={(value) => onChange('notes', value)}
            rows={4}
            placeholder="Es. Sono escluse dal presente preventivo tutte le opere edili e murarie… (lascia vuoto per nascondere)"
          />
          <div className="chip-row" style={{ marginTop: 10 }}>
            {NOTE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="chip"
                onClick={() => onAppend('notes', preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}