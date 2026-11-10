import React, { useMemo, useState } from 'react';
import { Panel } from '../components/Panel';
import { TextField } from '../components/Field';
import { SALUTATIONS, clientLabel, clientSubLabel, formatClientAddress } from './quoteModel';

/**
 * Destinatario del preventivo. Tutti i campi sono liberi: la rubrica è solo
 * una scorciatoia per riusare un cliente già scritto in passato.
 */
export function ClientPanel({ client, onChange, clients, onApplyClient, onRememberClient }) {
  const [touched, setTouched] = useState(false);

  const suggestions = useMemo(() => {
    const query = (client.name || '').trim().toLowerCase();
    const pool = clients.filter((item) => item.name);
    const matches = query
      ? pool.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.city || '').toLowerCase().includes(query) ||
            (item.address || '').toLowerCase().includes(query),
        )
      : pool;
    return matches.slice(0, 5);
  }, [client.name, clients]);

  const isOpen = touched && suggestions.length > 0;

  const pick = (item) => {
    onApplyClient(item);
    setTouched(false);
  };

  return (
    <Panel
      step="02"
      eyebrow="Destinatario"
      title="Intestatario"
      sub="Scrivi liberamente: nessun elenco obbligatorio."
      actions={
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onRememberClient}
          disabled={!client.name.trim()}
          title="Salva questo cliente in rubrica per ritrovarlo la prossima volta"
        >
          Salva in rubrica
        </button>
      }
    >
      <div className="grid-2">
        <div className="field suggest-wrap">
          <label className="field-label" htmlFor="cliente-nome">Nome o ragione sociale</label>
          <input
            id="cliente-nome"
            className="input"
            value={client.name}
            placeholder="Es. Narzisi Giorgio"
            autoComplete="off"
            onChange={(event) => {
              onApplyClient({ name: event.target.value });
              setTouched(true);
            }}
            onFocus={() => setTouched(true)}
            onBlur={() => window.setTimeout(() => setTouched(false), 120)}
          />
          {isOpen ? (
            <div className="suggest" role="listbox">
              {suggestions.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="suggest-item"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(item)}
                >
                  {clientLabel(item)}
                  {clientSubLabel(item) ? <small>{clientSubLabel(item)}</small> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <TextField
          label="Intestazione di cortesia"
          value={client.salutation}
          list="salutations"
          onChange={(value) => onChange('salutation', value)}
          placeholder="SPETT.LE"
          hint="Puoi scrivere qualsiasi formula."
        />
        <datalist id="salutations">
          {SALUTATIONS.map((item) => <option key={item} value={item} />)}
        </datalist>
      </div>

      <div style={{ marginTop: 14 }}>
        <TextField
          label="Indirizzo"
          value={client.address}
          onChange={(value) => onChange('address', value)}
          placeholder="Via, numero civico"
        />
      </div>

      <div className="grid-3" style={{ marginTop: 14 }}>
        <TextField label="CAP" value={client.cap} onChange={(value) => onChange('cap', value)} placeholder="00012" inputMode="numeric" />
        <TextField label="Città" value={client.city} onChange={(value) => onChange('city', value)} placeholder="Guidonia" />
        <TextField label="Provincia" value={client.province} onChange={(value) => onChange('province', value)} placeholder="RM" />
      </div>

      <div className="grid-3" style={{ marginTop: 14 }}>
        <TextField label="Telefono" value={client.phone} onChange={(value) => onChange('phone', value)} placeholder="+39 ..." inputMode="tel" />
        <TextField label="Email" value={client.email} onChange={(value) => onChange('email', value)} placeholder="cliente@email.it" inputMode="email" />
        <TextField label="P.IVA / C.F." value={client.tax_id} onChange={(value) => onChange('tax_id', value)} placeholder="00000000000" />
      </div>

      {clients.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Rubrica · {clients.length} salvati</div>
          <div className="chip-row">
            {clients.slice(0, 8).map((item) => (
              <button
                key={item.name}
                type="button"
                className="chip"
                onClick={() => onApplyClient(item)}
                title={formatClientAddress(item) || item.name}
              >
                {clientLabel(item)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
