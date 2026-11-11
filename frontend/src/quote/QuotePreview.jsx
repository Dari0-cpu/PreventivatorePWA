import React from 'react';
import { formatCurrency, formatDate } from '../lib/format';
import { computeQuoteTotals } from '../lib/totals';
import { formatClientAddress } from './quoteModel';
import logoUrl from '../assets/logo.png';

/** Documento finale: layout aziendale formale, font unico e rigoroso. */
export function QuotePreview({ quote }) {
  const totals = computeQuoteTotals(quote.sections);
  const clientAddress = formatClientAddress(quote.client);
  const hasClient = Boolean(quote.client.name.trim());
  const docNumber = quote.quote_number.trim()
    ? `PREVENTIVO N° ${quote.quote_number.trim()}`
    : 'PREVENTIVO';

  return (
    <article className="doc" id="documento-preventivo">
      {/* 1. INTESTAZIONE AZIENDALE PULITA */}
      <header className="doc-header">
        <div className="doc-brand-with-logo">
          <img
            src={logoUrl}
            alt="Logo"
            className="doc-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <div className="doc-brand-name">
              {quote.issuer.name || 'CRI.MA. IMPIANTI S.R.L.'}
            </div>
            <div className="doc-brand-lines">
              {quote.issuer.address ? <div>{quote.issuer.address}</div> : null}
              {quote.issuer.vat ? <div>P.IVA / C.F.: {quote.issuer.vat}</div> : null}
              {quote.issuer.email ? <div>Email: {quote.issuer.email}</div> : null}
              {quote.issuer.phone ? <div>Tel: {quote.issuer.phone}</div> : null}
            </div>
          </div>
        </div>

        <div className="doc-meta">
          <div className="doc-quote-num">{docNumber}</div>
          <div className="doc-date">Data: {formatDate(quote.date) || '—'}</div>
          <div className="doc-addressee">
            <div className="doc-salutation">{quote.client.salutation || 'SPETT.LE'}</div>
            <div className="doc-client-name">
              {hasClient ? quote.client.name : 'Destinatario da compilare'}
            </div>
            {clientAddress ? <div className="doc-client-addr">{clientAddress}</div> : null}
            {quote.client.tax_id ? (
              <div className="doc-client-addr">P.IVA / C.F.: {quote.client.tax_id}</div>
            ) : null}
          </div>
        </div>
      </header>

      {/* 2. OGGETTO FORMALE */}
      <div className="doc-object-bar">
        <span className="doc-object-label">OGGETTO:</span>
        <span className="doc-object-value">
          {quote.object_title || 'Preventivo di spesa come da capitolato.'}
        </span>
      </div>

      {/* 3. SEZIONI DEL PREVENTIVO */}
      {quote.sections.map((section, sectionIndex) => {
        const amount = totals.bySection[section.id]?.amount || 0;
        const hasSectionNotes = Boolean((section.section_notes || '').trim());
        const notesPos = section.notes_position || 'above';

        return (
          <section className="doc-section" key={section.id}>
            <div className="doc-section-title">
              <span>
                {section.title || `Sezione ${sectionIndex + 1}`}
                {section.is_optional ? (
                  <span className="doc-opt-label"> (Opzione alternativa)</span>
                ) : null}
              </span>
            </div>

            {section.body ? (
              <div
                className="doc-body"
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
            ) : (
              <div className="doc-empty">Descrizione da compilare…</div>
            )}

            {/* Note SOPRA al prezzo */}
            {hasSectionNotes && notesPos === 'above' ? (
              <div className="doc-section-notes">{section.section_notes}</div>
            ) : null}

            {/* Riquadro Prezzo contabile sobrio */}
            {amount > 0 ? (
              <div className="doc-section-price-box">
                <span className="doc-price-prefix">
                  Il prezzo di quanto sopra descritto è:
                </span>{' '}
                <strong className="doc-price-figure">
                  € {formatCurrency(amount)}
                </strong>
                {section.amount_note ? (
                  <span className="doc-price-vat"> {section.amount_note}</span>
                ) : null}
              </div>
            ) : null}

            {/* Note SOTTO al prezzo */}
            {hasSectionNotes && notesPos === 'below' ? (
              <div className="doc-section-notes">{section.section_notes}</div>
            ) : null}
          </section>
        );
      })}

      {/* 4. TOTALE (Solo se spuntato) */}
      {quote.show_total ? (
        <div className="doc-totals">
          {totals.optionsTotal > 0 ? (
            <div className="doc-totals-row">
              <span>Opzioni alternative (escluse)</span>
              <span className="num">€ {formatCurrency(totals.optionsTotal)}</span>
            </div>
          ) : null}
          <div className="doc-totals-row grand">
            <span>TOTALE COMPLESSIVO</span>
            <span className="num">€ {formatCurrency(totals.total)}</span>
          </div>
        </div>
      ) : null}

      {/* 5. PAGAMENTO ED ESCLUSIONI */}
      {(quote.payment_terms || '').trim() ? (
        <div className="doc-block">
          <div className="doc-block-title">Modalità di pagamento</div>
          <div className="doc-block-body">{quote.payment_terms}</div>
        </div>
      ) : null}

      {(quote.notes || '').trim() ? (
        <div className="doc-block">
          <div className="doc-block-title">Esclusioni</div>
          <div className="doc-block-body">{quote.notes}</div>
        </div>
      ) : null}

      {/* 6. PIÈ DI PAGINA (In anteprima e in stampa diretta) */}
      <footer className="doc-clean-footer" data-html2canvas-ignore="true">
        <span>
          <strong>{quote.issuer.name || 'CRI.MA. IMPIANTI S.R.L.'}</strong>
          {quote.issuer.address ? ` — ${quote.issuer.address}` : ''}
          {quote.issuer.vat ? ` — P.IVA ${quote.issuer.vat}` : ''}
        </span>
        <span>
          {[quote.issuer.phone, quote.issuer.email].filter(Boolean).join(' · ')}
        </span>
      </footer>
    </article>
  );
}