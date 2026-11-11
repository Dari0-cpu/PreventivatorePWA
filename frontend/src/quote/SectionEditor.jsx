import React, { useRef, useEffect } from 'react';
import { InlineTitle } from '../components/Field';
import { formatCurrency } from '../lib/format';
import { AMOUNT_NOTE_PRESETS, SECTION_TITLE_PRESETS } from './quoteModel';

export function SectionEditor({
  section,
  index,
  sectionCount,
  sectionAmount,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
}) {
  const editorRef = useRef(null);

  // Sincronizza il contenuto HTML solo quando cambia dall'esterno (senza far saltare il cursore)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (section.body || '')) {
      editorRef.current.innerHTML = section.body || '';
    }
  }, [section.id, section.body]);

  const execCommand = (event, command) => {
    event.preventDefault(); // Fondamentale: mantiene il testo selezionato quando clicchi il bottone
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, null);
    onUpdateSection('body', editorRef.current.innerHTML);
  };

  const notesPosition = section.notes_position || 'above';

  return (
    <div className="section-card">
      {/* 1. TITOLO SEZIONE (Senza prezzo in alto) */}
      <div className="section-head">
        <span className="eyebrow" style={{ flex: 'none' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineTitle
            value={section.title}
            onChange={(value) => onUpdateSection('title', value)}
            placeholder="Titolo sezione (es. OPZIONE 1)"
          />
        </div>
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

      {/* 2. EDITOR DESCRIZIONE CON TOOLBAR E LISTE FUNZIONANTI */}
      <div className="field" style={{ marginBottom: 14 }}>
        <span className="field-label">Descrizione delle lavorazioni</span>

        <div className="custom-rich-box">
          <div className="custom-rich-toolbar">
            <button
              type="button"
              className="custom-rich-btn"
              onMouseDown={(e) => execCommand(e, 'bold')}
              title="Grassetto (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="custom-rich-btn"
              onMouseDown={(e) => execCommand(e, 'italic')}
              title="Corsivo (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="custom-rich-btn"
              onMouseDown={(e) => execCommand(e, 'underline')}
              title="Sottolineato (Ctrl+U)"
            >
              <u>U</u>
            </button>

            <span className="custom-rich-sep" />

            <button
              type="button"
              className="custom-rich-btn"
              onMouseDown={(e) => execCommand(e, 'insertUnorderedList')}
              title="Elenco puntato"
            >
              • Elenco puntato
            </button>
            <button
              type="button"
              className="custom-rich-btn"
              onMouseDown={(e) => execCommand(e, 'insertOrderedList')}
              title="Elenco numerato"
            >
              1. Elenco numerato
            </button>
          </div>

          <div
            ref={editorRef}
            className="custom-rich-editor"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Descrivi le lavorazioni... Usa i pulsanti sopra per elenchi puntati, numerati, grassetto o sottolineato."
            onInput={(e) => onUpdateSection('body', e.currentTarget.innerHTML)}
          />
        </div>
      </div>

      {/* 3. NOTE DELLA SEZIONE (In grigio, posizionabili sopra o sotto al prezzo) */}
      <div className="field" style={{ marginBottom: 14 }}>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <label className="field-label" htmlFor={`sec-notes-${section.id}`} style={{ margin: 0 }}>
            Note della sezione (in grigio nel PDF)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="small muted">Posizione:</span>
            <select
              className="select"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={notesPosition}
              onChange={(e) => onUpdateSection('notes_position', e.target.value)}
            >
              <option value="above">Sopra al prezzo</option>
              <option value="below">Sotto al prezzo</option>
            </select>
          </div>
        </div>
        <textarea
          id={`sec-notes-${section.id}`}
          className="textarea"
          rows={2}
          style={{ color: '#9ca3af', fontStyle: 'italic' }}
          placeholder="Es. Note aggiuntive per questa sezione (opzionale)…"
          value={section.section_notes || ''}
          onChange={(e) => onUpdateSection('section_notes', e.target.value)}
        />
      </div>

      {/* 4. BLOCCO PREZZO A FINE SEZIONE */}
      <div className="amount-row">
        <div className="field">
          <label className="field-label" htmlFor={`amount-${section.id}`}>
            Importo sezione (€)
          </label>
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
          <label className="field-label" htmlFor={`note-${section.id}`}>
            Dicitura IVA / Note prezzo
          </label>
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
          <span className="field-label">Come esce nel box a fine sezione</span>
          <span className="amount-preview-value" style={{ fontSize: 13 }}>
            Il prezzo di quanto sopra descritto è{' '}
            <strong>
              € {formatCurrency(sectionAmount)}
              {section.amount_note ? <em> {section.amount_note}</em> : null}
            </strong>
          </span>
        </div>
      </div>

      <datalist id="amount-notes">
        {AMOUNT_NOTE_PRESETS.map((preset) => (
          <option key={preset} value={preset} />
        ))}
      </datalist>

      {/* 5. AZIONI SEZIONE */}
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