import React from 'react';
import { RichText } from '../components/RichText';
import { InlineTitle } from '../components/Field';
import { formatCurrency } from '../lib/format';
import { AMOUNT_NOTE_PRESETS, SECTION_TITLE_PRESETS } from './quoteModel';

/**
 * Sezione del preventivo: elenco di lavorazioni scritto liberamente
 * (con grassetti e sottolineature) e un importo scelto da te,
 * con la dicitura che vuoi accanto ("+ IVA", "+ IVA cadauno", …).
 */
export function SectionEditor({
  section,
  index,
  sectionCount,
  sectionAmount,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
}) {
  const bodyHelpId = `body-help-${section.id}`;

  return (
    <div className="section-card">
      <div className="section-head">
        <span className="eyebrow" style={{ flex: 'none' }}>{String(index + 1).padStart(2, '0')}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineTitle
            value={section.title}
            onChange={(value) => onUpdateSection('title', value)}
            placeholder="Titolo sezione (es. OPZIONE 1)"
          />
        </div>
        <span className="section-total amount">€ {formatCurrency(sectionAmount)}</span>
      </div>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        {SECTION_TITLE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="chip"
            onClick={() => onUpdateSection('title', preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <span className="field-label" id={bodyHelpId}>Descrizione delle lavorazioni</span>
        <RichText
          value={section.body}
          onChange={(html) => onUpdateSection('body', html)}
          placeholder="Es. Fornitura e posa in opera di climatizzatore… poi, a capo, scarico in polipropilene, montaggio…"
        />
        <span className="field-hint">
          Vai a capo liberamente: ogni riga è una voce. Usa gli elenchi per le liste di lavorazioni.
        </span>
      </div>

      <div className="amount-row">
        <div className="field">
          <label className="field-label" htmlFor={`amount-${section.id}`}>Importo (scritto da te)</label>
          <input
            id={`amount-${section.id}`}
            className="input amount-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={section.amount}
            onChange={(event) => onUpdateSection('amount', event.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor={`note-${section.id}`}>Dicitura accanto all’importo</label>
          <input
            id={`note-${section.id}`}
            className="input"
            list="amount-notes"
            placeholder="+ IVA"
            value={section.amount_note}
            onChange={(event) => onUpdateSection('amount_note', event.target.value)}
          />
        </div>

        <div className="amount-preview">
          <span className="field-label">Come esce</span>
          <span className="amount-preview-value">
            € {formatCurrency(sectionAmount)}
            {section.amount_note ? <em> {section.amount_note}</em> : null}
          </span>
        </div>
      </div>

      <datalist id="amount-notes">
        {AMOUNT_NOTE_PRESETS.map((preset) => <option key={preset} value={preset} />)}
      </datalist>

      <div className="row-between" style={{ marginTop: 16 }}>
        <label className="check" title="La sezione resta fuori dal totale generale">
          <input
            type="checkbox"
            checked={section.is_optional}
            onChange={(event) => onUpdateSection('is_optional', event.target.checked)}
          />
          Opzione alternativa (fuori dal totale)
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => onMoveSection(-1)}
            disabled={index === 0}
            title="Sposta su"
            aria-label="Sposta sezione su"
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => onMoveSection(1)}
            disabled={index === sectionCount - 1}
            title="Sposta giù"
            aria-label="Sposta sezione giù"
          >
            ↓
          </button>
          <button
            type="button"
            className="btn btn-icon btn-danger"
            onClick={onRemoveSection}
            disabled={sectionCount <= 1}
            title="Elimina sezione"
            aria-label="Elimina sezione"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
