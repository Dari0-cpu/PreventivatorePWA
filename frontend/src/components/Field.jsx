import React from 'react';

/**
 * Campo di testo etichettato. `variant="inline"` per i titoli dentro le card.
 */
export function TextField({ label, value, onChange, placeholder = '', hint, type = 'text', inputMode, className = '', autoComplete = 'off', list, id }) {
  const inputId = id || `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${className}`}>
      {label ? <label className="field-label" htmlFor={inputId}>{label}</label> : null}
      <input
        id={inputId}
        className="input"
        type={type}
        inputMode={inputMode}
        value={value ?? ''}
        placeholder={placeholder}
        autoComplete={autoComplete}
        list={list}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

/** Area di testo multiriga: descrizioni, note, condizioni. */
export function TextArea({ label, value, onChange, placeholder = '', rows = 3, hint, className = '' }) {
  const inputId = `t-${(label || 'text').replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${className}`}>
      {label ? <label className="field-label" htmlFor={inputId}>{label}</label> : null}
      <textarea
        id={inputId}
        className="textarea"
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

/** Select tematica per i valori che il backend valida (es. IVA). */
export function SelectField({ label, value, onChange, options, className = '' }) {
  const inputId = `s-${(label || 'select').replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${className}`}>
      {label ? <label className="field-label" htmlFor={inputId}>{label}</label> : null}
      <select
        id={inputId}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Input numerico monetario: tastiera numerica su mobile, cifre tabellari. */
export function AmountField({ label, value, onChange, placeholder = '0,00', step = '0.01', className = '', prefix }) {
  const inputId = `a-${(label || 'amount').replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${className}`}>
      {label ? <label className="field-label" htmlFor={inputId}>{label}</label> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prefix ? <span className="muted small">{prefix}</span> : null}
        <input
          id={inputId}
          className="input amount-input"
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

/** Titolo editabile dentro una card, senza cornice. */
export function InlineTitle({ value, onChange, placeholder }) {
  return (
    <input
      className="input input-inline"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      aria-label={placeholder || 'Titolo'}
    />
  );
}
