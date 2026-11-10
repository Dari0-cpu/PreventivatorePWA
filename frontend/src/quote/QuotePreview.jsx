import React from 'react';
import { formatCurrency, formatDate } from '../lib/format';
import { computeQuoteTotals } from '../lib/totals';
import { formatClientAddress } from './quoteModel';

/** Documento finale: stesso layout del preventivo che si consegna al cliente. */
export function QuotePreview({ quote }) {
  const totals = computeQuoteTotals(quote.sections);
  const clientAddress = formatClientAddress(quote.client);
  const hasClient = Boolean(quote.client.name.trim());
  const docNumber = quote.quote_number.trim() ? `PREVENTIVO N° ${quote.quote_number.trim()}` : 'PREVENTIVO';

  return (
    <article className="doc" id="documento-preventivo">
      <header className="doc-header">
        <div>
          <div className="doc-brand-name">{quote.issuer.name || 'Denominazione azienda'}</div>
          <div className="doc-brand-lines">
            {quote.issuer.address ? <div>{quote.issuer.address}</div> : null}
            {quote.issuer.vat ? <div>P.IVA: {quote.issuer.vat}</div> : null}
            {quote.issuer.email ? <div>{quote.issuer.email}</div> : null}
            {quote.issuer.phone ? <div>{quote.issuer.phone}</div> : null}
          </div>
        </div>

        <div className="doc-meta">
          <div className="doc-quote-num">{docNumber}</div>
          <div className="doc-date">Data: {formatDate(quote.date) || '—'}</div>
          <div className="doc-addressee">
            <div className="doc-salutation">{quote.client.salutation || 'SPETT.LE'}</div>
            <div className="doc-client-name">{hasClient ? quote.client.name : 'Destinatario da compilare'}</div>
            {clientAddress ? <div className="doc-client-addr">{clientAddress}</div> : null}
            {quote.client.tax_id ? <div className="doc-client-addr">P.IVA/CF: {quote.client.tax_id}</div> : null}
          </div>
        </div>
      </header>

      <p className="doc-object">
        <strong>OGGETTO:</strong> {quote.object_title || 'Preventivo di spesa come da capitolato.'}
      </p>

      {quote.sections.map((section, sectionIndex) => {
        const amount = totals.bySection[section.id]?.amount || 0;
        return (
          <section className="doc-section" key={section.id}>
            <div className="doc-section-title">
              <span>
                {section.title || `Sezione ${sectionIndex + 1}`}
                {section.is_optional ? ' · opzione alternativa' : ''}
              </span>
              {amount > 0 ? (
                <span className="doc-section-amount">
                  € {formatCurrency(amount)}
                  {section.amount_note ? <em> {section.amount_note}</em> : null}
                </span>
              ) : null}
            </div>

            {section.body ? (
              <div className="doc-body" dangerouslySetInnerHTML={{ __html: section.body }} />
            ) : (
              <div className="doc-empty">Descrizione da compilare…</div>
            )}
          </section>
        );
      })}

      <div className="doc-totals">
        {totals.optionsTotal > 0 ? (
          <div className="doc-totals-row">
            <span>Opzioni alternative (escluse)</span>
            <span className="num">€ {formatCurrency(totals.optionsTotal)}</span>
          </div>
        ) : null}
        <div className="doc-totals-row grand">
          <span>TOTALE</span>
          <span className="num">€ {formatCurrency(totals.total)}</span>
        </div>
      </div>

      {quote.payment_terms.trim() ? (
        <div className="doc-block">
          <div className="doc-block-title">Modalità di pagamento</div>
          <div className="doc-block-body">{quote.payment_terms}</div>
        </div>
      ) : null}

      {quote.notes.trim() ? (
        <div className="doc-block">
          <div className="doc-block-title">Note</div>
          <div className="doc-block-body">{quote.notes}</div>
        </div>
      ) : null}

      <div className="doc-sign">
        <span>Firma per accettazione</span>
        <span>Data</span>
      </div>
    </article>
  );
}
