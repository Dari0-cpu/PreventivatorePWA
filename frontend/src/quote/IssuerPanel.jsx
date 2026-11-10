import React, { useState } from 'react';
import { Panel } from '../components/Panel';
import { TextField } from '../components/Field';

/** Anagrafica dell'emittente: si compila una volta, resta salvata sul dispositivo. */
export function IssuerPanel({ issuer, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Panel
      step="01"
      eyebrow="Emittente"
      title="La tua azienda"
      sub={open ? 'Questi dati compaiono nell’intestazione del preventivo.' : `${issuer.name} · ${issuer.vat || 'P.IVA da compilare'}`}
      actions={
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((value) => !value)}>
          {open ? 'Chiudi' : 'Modifica'}
        </button>
      }
    >
      {open ? (
        <div className="stack-md">
          <div className="grid-2">
            <TextField label="Ragione sociale" value={issuer.name} onChange={(value) => onChange('name', value)} placeholder="CRI.MA IMPIANTI S.R.L." />
            <TextField label="Sigla logo" value={issuer.logo_text} onChange={(value) => onChange('logo_text', value)} placeholder="CM" hint="Due lettere usate come marchio testuale." />
          </div>
          <TextField label="Sede" value={issuer.address} onChange={(value) => onChange('address', value)} placeholder="Via, CAP, Città (PR)" />
          <div className="grid-3">
            <TextField label="P.IVA" value={issuer.vat} onChange={(value) => onChange('vat', value)} placeholder="00000000000" />
            <TextField label="Email" value={issuer.email} onChange={(value) => onChange('email', value)} placeholder="info@azienda.it" inputMode="email" />
            <TextField label="Telefono" value={issuer.phone} onChange={(value) => onChange('phone', value)} placeholder="+39 ..." inputMode="tel" />
          </div>
        </div>
      ) : (
        <p className="small muted" style={{ margin: 0 }}>
          Denominazione, sede, P.IVA e recapiti già impostati. Apri “Modifica” solo se cambiano.
        </p>
      )}
    </Panel>
  );
}
