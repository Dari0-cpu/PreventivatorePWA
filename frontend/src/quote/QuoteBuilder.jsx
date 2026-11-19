import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { NotesView } from '../notes/NotesView';
import { CalendarView } from '../calendar/CalendarView';
import { DicoView } from '../dico/DicoView';
import { DicoPrintPreview } from '../dico/DicoPrintPreview';
import {
  createEmptyDico,
  computeNextDicoNumber,
  getSavedDicos,
  saveDicoToArchive,
  deleteDicoFromArchive,
} from '../dico/dicoModel';

import {
  saveLastQuoteNumber,
  getSavedQuotes,
  saveQuoteToArchive,
  deleteQuoteFromArchive,
  exportQuoteToFile,
  fetchNextQuoteNumber,
  makeId,
  createEmptySection,
  formatClientAddress,
} from './quoteModel';
import {
  getSavedNotes,
  saveNoteToArchive,
  deleteNoteFromArchive,
  noteBodyToQuoteHtml,
} from '../notes/noteModel';
import {
  getCalendarEvents,
  saveCalendarEvent,
  toggleCalendarEventDone,
  deleteCalendarEvent,
} from '../calendar/calendarModel';
import { todayIso, formatDate, formatCurrency } from '../lib/format';
import { computeQuoteTotals } from '../lib/totals';

/* Icone SVG minimali */
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconArchive = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const IconNotes = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSave = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconPrinter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

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
    saveClient,
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

  // Di base apre sempre su Preventivo nuovo ('editor')
  const [activeView, setActiveView] = useState('editor');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  const [archivedQuotes, setArchivedQuotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const [dicos, setDicos] = useState([]);
  const [activeDico, setActiveDico] = useState(() => createEmptyDico('1'));

  const [archiveQuery, setArchiveQuery] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [newNoteTrigger, setNewNoteTrigger] = useState(0);
  const [jumpTodayTrigger, setJumpTodayTrigger] = useState(0);
  const [calendarPrefill, setCalendarPrefill] = useState(null);

  const fileInputRef = useRef(null);

  const getPdfFileName = () => {
    const num = (quote.quote_number || '').trim();
    const client = (quote.client?.name || '').trim() || 'Cliente';
    const clean = (str) => str.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');
    return num ? `Preventivo_${clean(num)}_${clean(client)}` : `Preventivo_${clean(client)}`;
  };

  useEffect(() => {
    getSavedQuotes().then(setArchivedQuotes);
    getSavedNotes().then(setNotes);
    getCalendarEvents().then(setCalendarEvents);

    getSavedDicos().then((list) => {
      setDicos(list);
      setActiveDico((prev) =>
        prev.client?.name || prev.impianto_descrizione
          ? prev
          : createEmptyDico(computeNextDicoNumber(list)),
      );
    });

    if (!quote.quote_number) {
      fetchNextQuoteNumber().then((nextNum) => setField('quote_number', nextNum));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayEventsCount = useMemo(() => {
    const today = todayIso();
    return calendarEvents.filter((ev) => ev.date === today && !ev.done).length;
  }, [calendarEvents]);

  const filteredArchive = useMemo(() => {
    const q = archiveQuery.trim().toLowerCase();
    if (!q) return archivedQuotes;
    return archivedQuotes.filter((item) => {
      const num = String(item.quote_number || '').toLowerCase();
      const client = String(item.client?.name || '').toLowerCase();
      const obj = String(item.object_title || '').toLowerCase();
      return num.includes(q) || client.includes(q) || obj.includes(q);
    });
  }, [archivedQuotes, archiveQuery]);

  const handleSaveQuote = async () => {
    setSaveNotice('Salvataggio…');
    const updatedList = await saveQuoteToArchive(quote, totals.total);
    setArchivedQuotes(updatedList);
    setSaveNotice('Salvato');
    window.setTimeout(() => setSaveNotice(''), 2500);
  };

  const handleDeleteFromArchive = async (quoteId) => {
    if (!window.confirm('Eliminare definitivamente questo preventivo dall’archivio?')) return;
    const updatedList = await deleteQuoteFromArchive(quoteId);
    setArchivedQuotes(updatedList);
  };

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
    setActiveView('editor');
    setSidebarOpen(false);
  };

  const handleDuplicateFromArchive = async (savedQuote) => {
    const nextNum = await fetchNextQuoteNumber();
    const duplicated = {
      ...savedQuote,
      id: makeId('quote'),
      quote_number: nextNum,
      date: todayIso(),
    };
    loadQuoteIntoEditor(duplicated);
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || ''));
        if (parsed && Array.isArray(parsed.sections)) {
          loadQuoteIntoEditor(parsed);
          const importedTotal = computeQuoteTotals(parsed.sections).total;
          const updatedList = await saveQuoteToArchive(parsed, importedTotal);
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

  const handleDownloadPdf = async () => {
    await handleSaveQuote();
    const element = document.getElementById('documento-preventivo');
    if (!element) return;

    try {
      setIsGeneratingPdf(true);
      const opt = {
        margin: [12, 12, 20, 12],
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
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(12, 282, 198, 282);

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

  const handleNewQuote = async () => {
    const hasContent = quote.client.name.trim() || quote.object_title.trim();
    if (
      hasContent &&
      !window.confirm(
        'Iniziare un nuovo preventivo? (Salva prima se non vuoi perdere la bozza attuale).',
      )
    ) {
      return;
    }
    saveLastQuoteNumber(quote.quote_number);
    startNewQuote();
    const nextNum = await fetchNextQuoteNumber();
    setField('quote_number', nextNum);
    setActiveView('editor');
    setSidebarOpen(false);
  };

  /* --- Azioni modulo Note --- */
  const handleSaveNote = async (noteData) => {
    const updatedList = await saveNoteToArchive(noteData);
    setNotes(updatedList);
    return updatedList.find((item) => item.id === noteData.id) || noteData;
  };

  const handleDeleteNote = async (noteId) => {
    const updatedList = await deleteNoteFromArchive(noteId);
    setNotes(updatedList);
  };

  /* --- Collegamento Nota -> Preventivo --- */
  const handleCreateQuoteFromNote = async (note) => {
    const hasDraftContent = quote.client.name.trim() || quote.object_title.trim();
    if (
      hasDraftContent &&
      !window.confirm(
        'Creare un nuovo preventivo da questa nota? La bozza corrente nell’editor verrà sostituita.',
      )
    ) {
      return;
    }

    const nextNum = await fetchNextQuoteNumber();
    startNewQuote();
    setField('quote_number', nextNum);
    if (note.client) {
      applyClient(note.client);
    }
    if (note.title?.trim()) {
      setField('object_title', note.title.trim());
    }
    if (note.body?.trim()) {
      const firstSection = {
        ...createEmptySection(note.title?.trim() || 'Preventivo di spesa'),
        body: noteBodyToQuoteHtml(note.body),
      };
      setField('sections', [firstSection]);
    }
    setActiveView('editor');
    setSidebarOpen(false);
  };

  /* --- Collegamento Nota -> Calendario --- */
  const handleScheduleFromNote = (note) => {
    setCalendarPrefill({
      client_name: note.client?.name || '',
      address: formatClientAddress(note.client) || '',
      phone: note.client?.phone || '',
      title: note.title?.trim() || 'Sopralluogo',
      notes: '',
    });
    setActiveView('calendar');
    setSidebarOpen(false);
  };

  /* --- Azioni modulo Calendario --- */
  const handleSaveEvent = async (eventData) => {
    const updatedList = await saveCalendarEvent(eventData);
    setCalendarEvents(updatedList);
  };

  const handleToggleEventDone = async (eventItem, done) => {
    const updatedList = await toggleCalendarEventDone(eventItem, done);
    setCalendarEvents(updatedList);
  };

  const handleDeleteEvent = async (eventId) => {
    const updatedList = await deleteCalendarEvent(eventId);
    setCalendarEvents(updatedList);
  };

  /* --- Azioni modulo DiCo 37/08 --- */
  const handleSaveDico = async (dicoData) => {
    const updatedList = await saveDicoToArchive(dicoData);
    setDicos(updatedList);
  };

  const handleDeleteDico = async (dicoId) => {
    if (!window.confirm('Eliminare definitivamente questa Dichiarazione di Conformità?')) return;
    const updatedList = await deleteDicoFromArchive(dicoId);
    setDicos(updatedList);
    if (activeDico.id === dicoId) {
      setActiveDico(updatedList[0] || createEmptyDico(computeNextDicoNumber(updatedList)));
    }
  };

  const handleNewDico = () => {
    setActiveDico(createEmptyDico(computeNextDicoNumber(dicos)));
  };

  const handleCreateDicoFromQuote = (sourceQuote) => {
    const fresh = createEmptyDico(computeNextDicoNumber(dicos));
    setActiveDico({
      ...fresh,
      client: { ...fresh.client, ...(sourceQuote.client || {}) },
      location: {
        ...fresh.location,
        address: sourceQuote.client?.address || '',
        cap: sourceQuote.client?.cap || '',
        city: sourceQuote.client?.city || '',
        province: sourceQuote.client?.province || 'RM',
      },
      impianto_descrizione: sourceQuote.object_title || '',
    });
    setActiveView('dico');
    setSidebarOpen(false);
  };

  const handlePrintDico = () => {
    const previousTitle = document.title;
    const num = (activeDico.dico_number || 'bozza').trim();
    const client = (activeDico.client?.name || 'Cliente').trim().replace(/\s+/g, '_');
    document.title = `DiCo_${num}_${client}`;
    window.setTimeout(() => {
      window.print();
      document.title = previousTitle;
    }, 80);
  };

  const switchView = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const topbarMeta = {
    editor: {
      title: quote.quote_number ? `Preventivo N° ${quote.quote_number}` : 'Preventivo nuovo',
      sub: quote.client?.name?.trim() || 'Compila i campi per generare il documento',
    },
    archive: {
      title: 'Archivio preventivi',
      sub: `${archivedQuotes.length} ${archivedQuotes.length === 1 ? 'preventivo salvato' : 'preventivi salvati'}`,
    },
    notes: {
      title: 'Note di lavoro',
      sub: `${notes.length} ${notes.length === 1 ? 'nota salvata' : 'note salvate'} · Sopralluoghi e dettatura vocale`,
    },
    calendar: {
      title: 'Calendario appuntamenti',
      sub:
        todayEventsCount > 0
          ? `${todayEventsCount} ${todayEventsCount === 1 ? 'impegno' : 'impegni'} in programma oggi`
          : 'Nessun impegno pendente per oggi',
    },
    dico: {
      title: activeDico.dico_number
        ? `DiCo 37/08 N° ${activeDico.dico_number}`
        : 'Dichiarazione di Conformità',
      sub: activeDico.client?.name?.trim() || 'Allegato I, Disegno CAD, Materiali e Foto',
    },
  }[activeView];

  return (
    <>
      <div className="app-shell no-print">
        {sidebarOpen ? (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        ) : null}

        {/* MENU A SINISTRA */}
        <aside className={`app-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Navigazione principale">
          <div className="sidebar-brand">
            <span className="sidebar-logo">{quote.issuer.logo_text || 'CM'}</span>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-brand-name">{quote.issuer.name || 'Preventivatore'}</div>
              <div className="sidebar-brand-sub">Gestione preventivi</div>
            </div>
          </div>

          <div className="sidebar-cta">
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleNewQuote}
            >
              <IconPlus />
              Nuovo preventivo
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Menu</div>

            <button
              type="button"
              className={`nav-item ${activeView === 'editor' ? 'is-active' : ''}`}
              onClick={() => switchView('editor')}
            >
              <IconFile />
              <span>Preventivo nuovo</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeView === 'archive' ? 'is-active' : ''}`}
              onClick={() => switchView('archive')}
            >
              <IconArchive />
              <span>Archivio</span>
              <span className="nav-badge">{archivedQuotes.length}</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeView === 'notes' ? 'is-active' : ''}`}
              onClick={() => switchView('notes')}
            >
              <IconNotes />
              <span>Note</span>
              <span className="nav-badge">{notes.length}</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeView === 'calendar' ? 'is-active' : ''}`}
              onClick={() => switchView('calendar')}
            >
              <IconCalendar />
              <span>Calendario</span>
              {todayEventsCount > 0 ? (
                <span className="nav-badge nav-badge-accent">{todayEventsCount}</span>
              ) : null}
            </button>

            <button
              type="button"
              className={`nav-item ${activeView === 'dico' ? 'is-active' : ''}`}
              onClick={() => switchView('dico')}
            >
              <IconShield />
              <span>DiCo 37/08</span>
              <span className="nav-badge">{dicos.length}</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <span>{quote.issuer.vat ? `P.IVA ${quote.issuer.vat}` : 'Dati azienda configurabili'}</span>
            <span style={{ opacity: 0.8 }}>{clients.length} clienti in rubrica</span>
          </div>
        </aside>

        {/* AREA DI LAVORO PRINCIPALE */}
        <div className="app-main">
          <header className="app-topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="btn btn-icon mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Apri menu"
              >
                <IconMenu />
              </button>

              <div style={{ minWidth: 0 }}>
                <div className="topbar-title">{topbarMeta.title}</div>
                <div className="topbar-sub">{topbarMeta.sub}</div>
              </div>

              {saveNotice && activeView === 'editor' ? (
                <span className="status-pill">{saveNotice}</span>
              ) : null}
            </div>

            <div className="topbar-actions">
              {activeView === 'editor' ? (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleSaveQuote}>
                    <IconSave />
                    Salva
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                  >
                    <IconDownload />
                    {isGeneratingPdf ? 'Creazione…' : 'Scarica PDF'}
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
                    <IconPrinter />
                    Stampa
                  </button>
                </>
              ) : null}

              {activeView === 'archive' ? (
                <>
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
                    Importa .json
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => exportQuoteToFile(quote)}
                  >
                    Esporta bozza .json
                  </button>
                </>
              ) : null}

              {activeView === 'notes' ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setNewNoteTrigger((n) => n + 1)}
                >
                  <IconPlus />
                  Nuova nota
                </button>
              ) : null}

              {activeView === 'calendar' ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setJumpTodayTrigger((n) => n + 1)}
                >
                  Vai a oggi
                </button>
              ) : null}

              {activeView === 'dico' ? (
              <DicoView
                dicos={dicos}
                activeDico={activeDico}
                onChangeDico={setActiveDico}
                onSelectDico={setActiveDico}
                onNewDico={handleNewDico}
                onSaveDico={handleSaveDico}
                onDeleteDico={handleDeleteDico}
                onPrintDico={handlePrintDico}
                clients={clients}
                issuer={quote.issuer}
              />
            ) : null}
            </div>
          </header>

          <main className="tp-container">
            {activeView === 'editor' ? (
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
                    title="Voci del preventivo"
                    sub="Organizza le lavorazioni in una o più sezioni con relativo importo."
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

                {/* ANTEPRIMA LIVE SU DESKTOP LARGO */}
                <div className="tp-col">
                  <div className="preview-dock">
                    <div className="row-between" style={{ marginBottom: 8 }}>
                      <span className="eyebrow">Anteprima documento</span>
                      <span className="small muted">
                        {quote.sections.length} {quote.sections.length === 1 ? 'sezione' : 'sezioni'}
                      </span>
                    </div>
                    <div className="doc-frame">
                      <div className="doc-scroll">
                        <QuotePreview quote={quote} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeView === 'archive' ? (
              <div>
                <div className="archive-toolbar">
                  <div className="archive-search">
                    <IconSearch />
                    <input
                      type="search"
                      className="input"
                      placeholder="Cerca per numero, cliente o oggetto…"
                      value={archiveQuery}
                      onChange={(e) => setArchiveQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="archive-table-wrap">
                  {filteredArchive.length === 0 ? (
                    <div className="archive-empty">
                      {archivedQuotes.length === 0
                        ? 'Nessun preventivo in archivio. Compila un preventivo e clicca "Salva" per archiviarlo.'
                        : 'Nessun preventivo corrisponde alla ricerca.'}
                    </div>
                  ) : (
                    <>
                      <div className="archive-row archive-row-head">
                        <span>Numero</span>
                        <span>Cliente e oggetto</span>
                        <span>Data</span>
                        <span style={{ textAlign: 'right' }}>Totale</span>
                        <span style={{ textAlign: 'right' }}>Azioni</span>
                      </div>

                      {filteredArchive.map((item) => {
                        const itemTotal = computeQuoteTotals(item.sections || []).total;
                        return (
                          <div key={item.id} className="archive-row">
                            <span className="archive-num">N° {item.quote_number || '—'}</span>

                            <div style={{ minWidth: 0 }}>
                              <div className="archive-client">
                                {item.client?.name || 'Cliente senza nome'}
                              </div>
                              <div className="archive-obj">
                                {item.object_title || 'Nessun oggetto specificato'}
                              </div>
                            </div>

                            <span className="small muted">{formatDate(item.date) || '—'}</span>

                            <span className="amount" style={{ textAlign: 'right', fontWeight: 600 }}>
                              € {formatCurrency(itemTotal)}
                            </span>

                            <div className="archive-actions">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => loadQuoteIntoEditor(item)}
                              >
                                Apri
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDuplicateFromArchive(item)}
                                title="Crea una copia con nuovo numero e data di oggi"
                              >
                                Duplica
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => exportQuoteToFile(item)}
                                title="Scarica backup .json"
                              >
                                JSON
                              </button>
                              <button
                                type="button"
                                className="btn btn-icon btn-danger"
                                onClick={() => handleDeleteFromArchive(item.id)}
                                title="Elimina"
                                aria-label="Elimina preventivo"
                              >
                                ✕
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleCreateDicoFromQuote(item)}
                                title="Crea Dichiarazione di Conformità precompilata"
                              >
                                DiCo
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {activeView === 'notes' ? (
              <NotesView
                notes={notes}
                clients={clients}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                onSaveClientToDirectory={saveClient}
                onCreateQuoteFromNote={handleCreateQuoteFromNote}
                onScheduleFromNote={handleScheduleFromNote}
                newNoteTrigger={newNoteTrigger}
              />
            ) : null}

            {activeView === 'calendar' ? (
              <CalendarView
                events={calendarEvents}
                clients={clients}
                onSaveEvent={handleSaveEvent}
                onToggleDone={handleToggleEventDone}
                onDeleteEvent={handleDeleteEvent}
                prefill={calendarPrefill}
                onClearPrefill={() => setCalendarPrefill(null)}
                jumpTodayTrigger={jumpTodayTrigger}
              />
            ) : null}
          </main>

          {activeView === 'editor' ? (
            <TotalsBar
              totals={totals}
              savedAt={savedAt}
              onPrint={handlePrint}
              onOpenPreview={() => setMobilePreview(true)}
            />
          ) : null}
        </div>

        {/* ANTEPRIMA FULLSCREEN SU SCHERMI MEDI / MOBILE */}
        {mobilePreview ? (
          <div className="preview-mobile-open no-print">
            <div className="preview-mobile-bar">
              <span className="eyebrow">Anteprima documento</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobilePreview(false)}
              >
                Chiudi
              </button>
            </div>
            <div className="doc-frame">
              <QuotePreview quote={quote} />
            </div>
          </div>
        ) : null}
      </div>

      {/* AREA DEDICATA ALLA STAMPA DI SISTEMA */}
      <div className="print-area">
        {activeView === 'dico' ? (
          <DicoPrintPreview dico={activeDico} issuer={quote.issuer} />
        ) : (
          <QuotePreview quote={quote} />
        )}
      </div>
    </>
  );
}