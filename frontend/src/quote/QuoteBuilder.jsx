import React, { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { useQuote } from './useQuote';
import { IssuerPanel } from './IssuerPanel';
import { ClientPanel } from './ClientPanel';
import { DocumentMeta } from './DocumentMeta';
import { SectionEditor } from './SectionEditor';
import { TermsPanel } from './TermsPanel';
import { QuotePreview } from './QuotePreview';
import { TotalsBar } from './TotalsBar';
import { Panel } from '../components/Panel';
import {
  saveLastQuoteNumber,
  getSavedQuotes,
  saveQuoteToArchive,
  deleteQuoteFromArchive,
  exportQuoteToFile,
  getNextQuoteNumber,
  makeId,
} from './quoteModel';
import { todayIso, formatDate } from '../lib/format';


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
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivedQuotes, setArchivedQuotes] = useState([]);
  const [saveNotice, setSaveNotice] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const fileInputRef = useRef(null);

  // Costruisce il nome del file PDF (es. "Preventivo_20_Mario_Rossi")
  const getPdfFileName = () => {
    const num = (quote.quote_number || '').trim() || 'Bozza';
    const client = (quote.client?.name || '').trim() || 'Cliente';
    const clean = (str) => str.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');
    return `Preventivo_${clean(client)}`;
  };

// All'avvio carica l'archivio dal database Supabase e aggiorna il numero progressivo
  useEffect(() => {
    getSavedQuotes().then((list) => {
      setArchivedQuotes(list);
    });
    if (!quote.quote_number) {
      fetchNextQuoteNumber().then((nextNum) => setField('quote_number', nextNum));
    }
  }, []);

  const handleSaveQuote = async () => {
    setSaveNotice('Salvataggio in corso...');
    const updatedList = await saveQuoteToArchive(quote, totals.total);
    setArchivedQuotes(updatedList);
    setSaveNotice('Salvato nel cloud!');
    window.setTimeout(() => setSaveNotice(''), 2500);
  };

  const handleDeleteFromArchive = async (quoteId) => {
    if (!window.confirm('Eliminare definitivamente questo preventivo dal database?')) return;
    const updatedList = await deleteQuoteFromArchive(quoteId);
    setArchivedQuotes(updatedList);
  };

  // 2. Carica un preventivo salvato nell'editor per modificarlo
  const loadQuoteIntoEditor = (savedQuote) => {
    const fields = [
      'id',
      'quote_number',
      'date',
      'object_title',
      'payment_terms',
      'notes',
      'show_total',
      'issuer',
      'client',
      'sections',
    ];
    fields.forEach((field) => {
      if (savedQuote[field] !== undefined) {
        setField(field, savedQuote[field]);
      }
    });
    setArchiveOpen(false);
  };

  // 3. Duplica un vecchio preventivo (nuovo ID, data di oggi e nuovo numero)
  const handleDuplicateFromArchive = (savedQuote) => {
    const duplicated = {
      ...savedQuote,
      id: makeId('quote'),
      quote_number: getNextQuoteNumber(),
      date: todayIso(),
    };
    loadQuoteIntoEditor(duplicated);
  };


  // 5. Importa un preventivo da file .json
  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || ''));
        if (parsed && Array.isArray(parsed.sections)) {
          loadQuoteIntoEditor(parsed);
          const updatedList = saveQuoteToArchive(parsed);
          setArchivedQuotes(updatedList);
        } else {
          window.alert('File non valido.');
        }
      } catch {
        window.alert('Impossibile leggere il file selezionato.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // 6. Stampa / Salva come PDF dal dialogo di sistema (con nome file automatico)
  const handlePrint = () => {
    handleSaveQuote();
    setMobilePreview(false);
    const previousTitle = document.title;
    document.title = getPdfFileName();
    window.setTimeout(() => {
      window.print();
      document.title = previousTitle;
    }, 60);
  };

// Scarica direttamente il PDF con piè di pagina ripetuto su OGNI pagina
  const handleDownloadPdf = async () => {
    await handleSaveQuote();
    const element = document.getElementById('documento-preventivo');
    if (!element) return;

    try {
      setIsGeneratingPdf(true);
      const opt = {
        margin: [12, 12, 20, 12], // 20mm in basso riservati al piè di pagina su ogni foglio
        filename: `${getPdfFileName()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      const worker = html2pdf().set(opt).from(element).toPdf();
      const pdf = await worker.get('pdf');
      const totalPages = pdf.internal.getNumberOfPages();

      const leftText = [
        quote.issuer.name || 'CRI.MA. IMPIANTI S.R.L.',
        quote.issuer.address,
        quote.issuer.vat ? `P.IVA ${quote.issuer.vat}` : '',
      ]
        .filter(Boolean)
        .join('  ·  ');

      const rightText = [quote.issuer.phone, quote.issuer.email]
        .filter(Boolean)
        .join('  ·  ');

      for (let i = 1; i <= totalPages; i += 1) {
        pdf.setPage(i);
        // Linea sottile separatrice a fondo pagina
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(12, 282, 198, 282);

        // Testo piè di pagina a sinistra, contatti al centro/destra e numero pagina
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(leftText, 12, 286.5);
        if (rightText) {
          pdf.text(`${rightText}   |   Pag. ${i} / ${totalPages}`, 198, 286.5, {
            align: 'right',
          });
        } else {
          pdf.text(`Pag. ${i} / ${totalPages}`, 198, 286.5, { align: 'right' });
        }
      }

      await worker.save();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleNewQuote = () => {
    const hasContent = quote.client.name.trim() || quote.object_title.trim();
    if (hasContent && !window.confirm('Iniziare un nuovo preventivo? (Consiglio: clicca prima su "Salva" per non perderlo).')) {
      return;
    }
    saveLastQuoteNumber(quote.quote_number);
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
              <div className="tp-brand-sub">
                {saveNotice ? (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{saveNotice}</span>
                ) : (
                  'Redazione preventivi'
                )}
              </div>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleNewQuote}>
              Nuovo
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleSaveQuote}>
              💾 Salva
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setArchiveOpen(true)}
            >
              📂 Archivio ({archivedQuotes.length})
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm no-print"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Creazione PDF…' : '⬇ Scarica PDF'}
            </button>
            <button type="button" className="btn btn-primary btn-sm no-print" onClick={handlePrint}>
              Stampa / PDF
            </button>
          </div>
        </header>

        {/* PANNELLO ARCHIVIO PREVENTIVI PER MODIFICARLI IN FUTURO */}
        {archiveOpen ? (
          <div className="archive-modal-backdrop no-print" onClick={() => setArchiveOpen(false)}>
            <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
              <div className="row-between" style={{ marginBottom: 14 }}>
                <div>
                  <span className="eyebrow">Archivio Preventivi</span>
                  <h3 style={{ margin: '4px 0 0', fontSize: 18 }}>
                    Preventivi salvati ({archivedQuotes.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Carica da file (.json)
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => exportQuoteToFile(quote)}
                  >
                    Scarica corrente (.json)
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setArchiveOpen(false)}
                  >
                    Chiudi ✕
                  </button>
                </div>
              </div>

              {archivedQuotes.length === 0 ? (
                <p className="small muted" style={{ padding: '24px 0', textAlign: 'center' }}>
                  Nessun preventivo salvato. Clicca su "💾 Salva" in alto per salvare il preventivo attuale e modificarlo quando vuoi.
                </p>
              ) : (
                <div className="archive-list">
                  {archivedQuotes.map((item) => (
                    <div key={item.id} className="archive-item">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          Preventivo N° {item.quote_number || '—'} ·{' '}
                          {item.client?.name || 'Cliente senza nome'}
                        </div>
                        <div className="small muted">
                          Data: {formatDate(item.date) || '—'} ·{' '}
                          {item.object_title || 'Nessun oggetto'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => loadQuoteIntoEditor(item)}
                        >
                          Apri e modifica
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDuplicateFromArchive(item)}
                          title="Crea un nuovo preventivo partendo da questo"
                        >
                          Duplica
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => exportQuoteToFile(item)}
                          title="Scarica copia su PC"
                        >
                          File
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-danger"
                          onClick={() => handleDeleteFromArchive(item.id)}
                          title="Elimina"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

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
                      sectionAmount={totals.bySection[section.id]?.amount || 0}
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