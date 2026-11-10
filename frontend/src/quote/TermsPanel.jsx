import React from 'react';
import { Panel } from '../components/Panel';
import { TextArea } from '../components/Field';
import { PAYMENT_PRESETS, NOTE_PRESETS } from './quoteModel';

/** Modalità di pagamento e note: testo libero con scorciatoie pronte. */
export function TermsPanel({ quote, onChange, onAppend }) {
  return (
    <Panel
      step="05"
      eyebrow="Condizioni"
      title="Pagamento e note"
      sub="Scrivi quello che serve: le scorciatoie aggiungono solo testo."
    >
      <div className="stack-md">
        <div>
          <TextArea
            label="Modalità di pagamento"
            value={quote.payment_terms}
            onChange={(value) => onChange('payment_terms', value)}
            rows={3}
            placeholder="Es. 30% all'ordine, saldo fine lavori"
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
            label="Note e clausole"
            value={quote.notes}
            onChange={(value) => onChange('notes', value)}
            rows={4}
            placeholder="Es. NOTA BENE: l'area di lavoro deve essere libera…"
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
