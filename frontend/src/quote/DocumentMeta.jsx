import React from 'react';
import { Panel } from '../components/Panel';
import { TextField, TextArea } from '../components/Field';

/** Testata del documento: numero, data e oggetto del preventivo. */
export function DocumentMeta({ quote, onChange }) {
  return (
    <Panel
      step="03"
      eyebrow="Documento"
      title="Testata"
      sub="Numero, data e oggetto compaiono in cima al preventivo."
    >
      <div className="grid-3">
        <TextField
          label="Numero preventivo"
          value={quote.quote_number}
          onChange={(value) => onChange('quote_number', value)}
          placeholder="20"
          hint="Il numero che dai tu."
        />
        <TextField
          label="Data"
          value={quote.date}
          onChange={(value) => onChange('date', value)}
          type="date"
        />
        <div className="field">
          <span className="field-label">Riepilogo</span>
          <div className="small muted" style={{ paddingTop: 10 }}>
            {quote.sections.length} {quote.sections.length === 1 ? 'sezione' : 'sezioni'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <TextArea
          label="Oggetto"
          value={quote.object_title}
          onChange={(value) => onChange('object_title', value)}
          rows={2}
          placeholder="Es. Preventivo di spesa come da capitolato."
          hint="Compare come “OGGETTO:” sotto l’intestazione."
        />
      </div>
    </Panel>
  );
}