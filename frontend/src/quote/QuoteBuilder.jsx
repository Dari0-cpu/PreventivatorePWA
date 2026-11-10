import React, { useState } from 'react';
import { useQuote } from './useQuote';
import { IssuerPanel } from './IssuerPanel';
import { ClientPanel } from './ClientPanel';
import { DocumentMeta } from './DocumentMeta';
import { SectionEditor } from './SectionEditor';
import { TermsPanel } from './TermsPanel';
import { QuotePreview } from './QuotePreview';
import { TotalsBar } from './TotalsBar';
import { Panel } from '../components/Panel';

export default function QuoteBuilder() {
  const {
    quote,
    clients,
    totals,
    savedAt,
    setField,
    setClientField,
    setIssuerField,
    applyClient,
    rememberClient,
    appendText,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    addLine,
    updateLine,
    duplicateLine,
    removeLine,
    startNewQuote,
  } = useQuote();

  const [mobilePreview, setMobilePreview] = useState(false);

  const handlePrint = () => {
    setMobilePreview(false);
    window.setTimeout(() => window.print(), 60);
  };

  const handleNewQuote = () => {
    const hasContent = quote.client.name.trim() || quote.object_title.trim();
    if (hasContent && !window.confirm('Iniziare un nuovo preventivo? La bozza attuale verrà sostituita.')) {
      return;
    }
    startNewQuote();
  };

  return (
    <>
      <div className="tp-app">
        <div className="tp-fx" aria-hidden="true" />

        <header className="tp-header no-print">
          <div className="tp-brand">
            <span className="tp-brand-mark">{quote.issuer.logo_text || 'PV'}</span>
            <div style={{ minWidth: 0 }}>
              <div className="tp-brand-name">{quote.issuer.name || 'Preventivatore'}</div>
              <div className="tp-brand-sub">Redazione preventivi</div>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleNewQuote}>
              Nuovo
            </button>
            <button type="button" className="btn btn-primary btn-sm no-print" onClick={handlePrint}>
              Genera PDF
            </button>
          </div>
        </header>

        <main className="tp-container">
          <div className="tp-layout">
            <div className="tp-col">
              <IssuerPanel issuer={quote.issuer} onChange={setIssuerField} />

              <ClientPanel
                client={quote.client}
                clients={clients}
                onChange={setClientField}
                onApplyClient={applyClient}
                onRememberClient={rememberClient}
              />

              <DocumentMeta quote={quote} onChange={setField} />

              <Panel
                step="04"
                eyebrow="Capitolato"
                title="Voci del preventivo"
                sub="Sezioni libere: “OPZIONE 1”, “Ricambio Aria”, quello che serve."
              >
                <div>
                  {quote.sections.map((section, index) => (
                    <SectionEditor
                      key={section.id}
                      section={section}
                      index={index}
                      sectionCount={quote.sections.length}
                      sectionTotals={totals.bySection[section.id] || { net: 0 }}
                      onUpdateSection={(field, value) => updateSection(section.id, field, value)}
                      onRemoveSection={() => removeSection(section.id)}
                      onMoveSection={(direction) => moveSection(section.id, direction)}
                      onAddLine={() => addLine(section.id)}
                      onUpdateLine={(lineId, field, value) => updateLine(section.id, lineId, field, value)}
                      onDuplicateLine={(lineId) => duplicateLine(section.id, lineId)}
                      onRemoveLine={(lineId) => removeLine(section.id, lineId)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 14, borderStyle: 'dashed' }}
                  onClick={addSection}
                >
                  + Aggiungi sezione
                </button>
              </Panel>

              <TermsPanel quote={quote} onChange={setField} onAppend={appendText} />
            </div>

            <div className="tp-col no-print">
              <div className="preview-dock">
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <span className="eyebrow">Anteprima documento</span>
                  <span className="small muted">{quote.sections.length} sezioni</span>
                </div>
                <div className="doc-frame">
                  <div className="doc-scroll">
                    <QuotePreview quote={quote} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <TotalsBar
          totals={totals}
          savedAt={savedAt}
          onPrint={handlePrint}
          onOpenPreview={() => setMobilePreview(true)}
        />

        {mobilePreview ? (
          <div className="preview-mobile-open no-print">
            <div className="preview-mobile-bar">
              <span className="eyebrow">Anteprima documento</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMobilePreview(false)}>
                Chiudi
              </button>
            </div>
            <div className="doc-frame">
              <QuotePreview quote={quote} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="print-area">
        <QuotePreview quote={quote} />
      </div>
    </>
  );
}
