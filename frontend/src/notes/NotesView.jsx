import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TextField } from '../components/Field';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { appendTranscript } from './transcriptCleaner';
import {
  createEmptyNote,
  formatNoteTimestamp,
  polishNoteTextWithAI,
} from './noteModel';
import {
  SALUTATIONS,
  clientLabel,
  clientSubLabel,
  formatClientAddress,
} from '../quote/quoteModel';

const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconStop = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const IconSparkles = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function NotesView({
  notes,
  clients,
  onSaveNote,
  onDeleteNote,
  onSaveClientToDirectory,
  onCreateQuoteFromNote,
  onScheduleFromNote,
  newNoteTrigger,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(() => notes[0] || createEmptyNote());
  const [mobileScreen, setMobileScreen] = useState('list'); // 'list' | 'editor'
  const [showExtraClientFields, setShowExtraClientFields] = useState(false);
  const [clientSuggestOpen, setClientSuggestOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState('');
  const [previousBody, setPreviousBody] = useState(null);

  const handleFinalTranscript = useCallback((chunk) => {
    setActiveNote((prev) => ({
      ...prev,
      body: appendTranscript(prev.body, chunk),
    }));
  }, []);

  const speech = useSpeechToText({
    lang: 'it-IT',
    onFinalTranscript: handleFinalTranscript,
  });

  // Se l'utente clicca "+ Nuova nota" dalla topbar
  useEffect(() => {
    if (!newNoteTrigger) return;
    speech.stop();
    setActiveNote(createEmptyNote());
    setPreviousBody(null);
    setPolishError('');
    setMobileScreen('editor');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNoteTrigger]);

  // Se la nota attiva viene eliminata altrove, seleziona la prima disponibile
  useEffect(() => {
    if (!notes.length) return;
    const stillExists = notes.some((n) => n.id === activeNote.id);
    if (!stillExists && !activeNote.body && !activeNote.client?.name && !activeNote.title) {
      setActiveNote(notes[0]);
    }
  }, [notes, activeNote.id, activeNote.body, activeNote.client?.name, activeNote.title]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const hay = [
        n.client?.name,
        n.client?.address,
        n.client?.city,
        n.title,
        n.body,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [notes, searchQuery]);

  const clientSuggestions = useMemo(() => {
    const query = (activeNote.client?.name || '').trim().toLowerCase();
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
  }, [activeNote.client?.name, clients]);

  const isSuggestOpen = clientSuggestOpen && clientSuggestions.length > 0;
  const isSavedInList = notes.some((n) => n.id === activeNote.id);

  const updateNoteField = (field, value) => {
    setActiveNote((prev) => ({ ...prev, [field]: value }));
  };

  const updateClientField = (field, value) => {
    setActiveNote((prev) => ({
      ...prev,
      client: { ...prev.client, [field]: value },
    }));
  };

  const applyClientPreset = (clientData) => {
    setActiveNote((prev) => ({
      ...prev,
      client: { ...prev.client, ...clientData },
    }));
    setClientSuggestOpen(false);
  };

  const handleSelectNote = (note) => {
    speech.stop();
    setActiveNote(note);
    setPreviousBody(null);
    setPolishError('');
    setMobileScreen('editor');
  };

  const handleCreateNew = () => {
    speech.stop();
    setActiveNote(createEmptyNote());
    setPreviousBody(null);
    setPolishError('');
    setMobileScreen('editor');
  };

  const handleSave = async () => {
    speech.stop();
    setSaveFeedback('Salvataggio…');
    const saved = await onSaveNote(activeNote);
    if (saved) {
      setActiveNote(saved);
    }
    setSaveFeedback('Salvato');
    window.setTimeout(() => setSaveFeedback(''), 2200);
  };

  const handleDelete = async () => {
    if (!window.confirm('Eliminare definitivamente questa nota?')) return;
    speech.stop();
    await onDeleteNote(activeNote.id);
    const remaining = notes.filter((n) => n.id !== activeNote.id);
    setActiveNote(remaining[0] || createEmptyNote());
    setPreviousBody(null);
    setMobileScreen('list');
  };

  const handlePolishAI = async () => {
    if (!activeNote.body?.trim() || isPolishing) return;
    speech.stop();
    setPolishError('');
    setIsPolishing(true);
    const snapshot = activeNote.body;

    try {
      const cleaned = await polishNoteTextWithAI(snapshot);
      setPreviousBody(snapshot);
      updateNoteField('body', cleaned);
    } catch (err) {
      setPolishError(
        err?.message ||
          'Funzione "Sistema testo" non ancora attiva su Supabase (Edge Function polish-note).',
      );
    } finally {
      setIsPolishing(false);
    }
  };

  const handleUndoPolish = () => {
    if (previousBody === null) return;
    updateNoteField('body', previousBody);
    setPreviousBody(null);
  };

  const handleRememberClient = () => {
    if (!activeNote.client?.name?.trim()) return;
    onSaveClientToDirectory(activeNote.client);
    setSaveFeedback('Cliente salvato in rubrica');
    window.setTimeout(() => setSaveFeedback(''), 2200);
  };

  return (
    <div className={`notes-layout ${mobileScreen === 'editor' ? 'is-mobile-editor' : 'is-mobile-list'}`}>
      {/* COLONNA SINISTRA: ELENCO NOTE */}
      <aside className="notes-list-col" aria-label="Elenco note">
        <div className="notes-list-toolbar">
          <div className="notes-search">
            <IconSearch />
            <input
              type="search"
              className="input"
              placeholder="Cerca cliente, indirizzo o testo…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCreateNew}
          >
            <IconPlus />
            Nuova
          </button>
        </div>

        <div className="notes-list-items">
          {filteredNotes.length === 0 ? (
            <div className="notes-empty">
              {notes.length === 0
                ? 'Nessuna nota salvata. Crea una nota per iniziare a raccogliere appunti di sopralluogo.'
                : 'Nessuna nota corrisponde alla ricerca.'}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === activeNote.id;
              const previewText = (note.body || '').trim() || 'Nessun appunto scritto…';
              return (
                <button
                  key={note.id}
                  type="button"
                  className={`note-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="note-card-head">
                    <span className="note-card-client">
                      {note.client?.name?.trim() || 'Cliente senza nome'}
                    </span>
                    <span className="note-card-date">
                      {formatNoteTimestamp(note.updated_at)}
                    </span>
                  </div>
                  {note.title?.trim() ? (
                    <div className="note-card-title">{note.title}</div>
                  ) : null}
                  <div className="note-card-preview">{previewText}</div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* COLONNA DESTRA: EDITOR NOTA */}
      <section className="notes-editor-col" aria-label="Editor nota">
        <div className="notes-mobile-back">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              speech.stop();
              setMobileScreen('list');
            }}
          >
            ← Tutte le note ({notes.length})
          </button>
          {saveFeedback ? <span className="status-pill">{saveFeedback}</span> : null}
        </div>

        {/* BARRA AZIONI NOTA */}
        <div className="panel notes-editor-panel">
          <div className="notes-actions-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
                Salva nota
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  const saved = (await onSaveNote(activeNote)) || activeNote;
                  onCreateQuoteFromNote(saved);
                }}
              >
                Crea preventivo
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  const saved = (await onSaveNote(activeNote)) || activeNote;
                  onScheduleFromNote(saved);
                }}
              >
                Fissa appuntamento
              </button>
              {saveFeedback ? (
                <span className="status-pill notes-desktop-feedback">{saveFeedback}</span>
              ) : null}
            </div>

            {isSavedInList ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger"
                onClick={handleDelete}
              >
                Elimina
              </button>
            ) : null}
          </div>

          {/* ANAGRAFICA CLIENTE (COMPATTA + ESPANDIBILE) */}
          <div className="note-client-box">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <div>
                <div className="eyebrow">Cliente / Cantiere</div>
                <div className="small muted">
                  Usa la stessa rubrica dei preventivi.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleRememberClient}
                  disabled={!activeNote.client?.name?.trim()}
                >
                  Salva in rubrica
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowExtraClientFields((v) => !v)}
                >
                  {showExtraClientFields ? 'Meno campi' : 'Altri dati'}
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="field suggest-wrap">
                <label className="field-label" htmlFor="nota-cliente-nome">
                  Nome o ragione sociale
                </label>
                <input
                  id="nota-cliente-nome"
                  className="input"
                  value={activeNote.client?.name || ''}
                  placeholder="Es. Mario Rossi"
                  autoComplete="off"
                  onChange={(e) => {
                    updateClientField('name', e.target.value);
                    setClientSuggestOpen(true);
                  }}
                  onFocus={() => setClientSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setClientSuggestOpen(false), 130)}
                />
                {isSuggestOpen ? (
                  <div className="suggest" role="listbox">
                    {clientSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="suggest-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyClientPreset(item)}
                      >
                        {clientLabel(item)}
                        {clientSubLabel(item) ? <small>{clientSubLabel(item)}</small> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <TextField
                id="nota-cliente-tel"
                label="Telefono"
                value={activeNote.client?.phone || ''}
                onChange={(v) => updateClientField('phone', v)}
                placeholder="+39 ..."
                inputMode="tel"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <TextField
                id="nota-cliente-indirizzo"
                label="Indirizzo"
                value={activeNote.client?.address || ''}
                onChange={(v) => updateClientField('address', v)}
                placeholder="Via, numero civico"
              />
            </div>

            {showExtraClientFields ? (
              <div className="stack-sm" style={{ marginTop: 12 }}>
                <div className="grid-3">
                  <TextField
                    id="nota-cliente-cap"
                    label="CAP"
                    value={activeNote.client?.cap || ''}
                    onChange={(v) => updateClientField('cap', v)}
                    placeholder="00012"
                    inputMode="numeric"
                  />
                  <TextField
                    id="nota-cliente-citta"
                    label="Città"
                    value={activeNote.client?.city || ''}
                    onChange={(v) => updateClientField('city', v)}
                    placeholder="Guidonia"
                  />
                  <TextField
                    id="nota-cliente-prov"
                    label="Provincia"
                    value={activeNote.client?.province || ''}
                    onChange={(v) => updateClientField('province', v)}
                    placeholder="RM"
                  />
                </div>

                <div className="grid-3">
                  <TextField
                    id="nota-cliente-salutation"
                    label="Intestazione"
                    value={activeNote.client?.salutation || ''}
                    list="note-salutations"
                    onChange={(v) => updateClientField('salutation', v)}
                    placeholder="SPETT.LE"
                  />
                  <TextField
                    id="nota-cliente-email"
                    label="Email"
                    value={activeNote.client?.email || ''}
                    onChange={(v) => updateClientField('email', v)}
                    placeholder="cliente@email.it"
                    inputMode="email"
                  />
                  <TextField
                    id="nota-cliente-tax"
                    label="P.IVA / C.F."
                    value={activeNote.client?.tax_id || ''}
                    onChange={(v) => updateClientField('tax_id', v)}
                    placeholder="00000000000"
                  />
                </div>
                <datalist id="note-salutations">
                  {SALUTATIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>
            ) : formatClientAddress(activeNote.client) ? (
              <div className="small muted" style={{ marginTop: 8 }}>
                Indirizzo completo: {formatClientAddress(activeNote.client)}
              </div>
            ) : null}
          </div>

          {/* TITOLO BREVE */}
          <div style={{ marginTop: 16 }}>
            <TextField
              id="nota-titolo"
              label="Titolo breve (opzionale)"
              value={activeNote.title || ''}
              onChange={(v) => updateNoteField('title', v)}
              placeholder="Es. Sopralluogo ristrutturazione piano terra"
            />
          </div>

          {/* AREA APPUNTI + MICROFONO SVG */}
          <div className="field" style={{ marginTop: 16 }}>
            <div className="note-body-head">
              <label className="field-label" htmlFor="nota-corpo">
                Appunti sul lavoro
              </label>

              <div className="note-voice-controls">
                {previousBody !== null ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleUndoPolish}
                  >
                    Annulla modifica AI
                  </button>
                ) : null}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handlePolishAI}
                  disabled={!activeNote.body?.trim() || isPolishing || speech.isListening}
                  title="Riordina e pulisce il dettato tramite AI"
                >
                  <IconSparkles />
                  {isPolishing ? 'Sistemazione testo…' : 'Sistema testo'}
                </button>

                <button
                  type="button"
                  className={`btn mic-btn ${speech.isListening ? 'is-listening' : ''}`}
                  onClick={speech.toggle}
                  disabled={!speech.isSupported || isPolishing}
                  title={
                    speech.isSupported
                      ? speech.isListening
                        ? 'Ferma dettatura vocale'
                        : 'Avvia dettatura vocale (it-IT)'
                      : 'Dettatura supportata su Chrome, Edge e Safari'
                  }
                >
                  {speech.isListening ? (
                    <>
                      <span className="mic-pulse-dot" aria-hidden="true" />
                      <IconStop />
                      <span>Stop dettatura</span>
                    </>
                  ) : (
                    <>
                      <IconMic />
                      <span>Detta</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {speech.error ? (
              <div className="note-alert" role="alert">
                <span>{speech.error}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={speech.clearError}
                >
                  Chiudi
                </button>
              </div>
            ) : null}

            {polishError ? (
              <div className="note-alert" role="alert">
                <span>{polishError}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPolishError('')}
                >
                  Chiudi
                </button>
              </div>
            ) : null}

            <textarea
              id="nota-corpo"
              className="textarea note-body-textarea"
              rows={11}
              value={activeNote.body || ''}
              placeholder="Scrivi o premi 'Detta' per prendere appunti vocali in cantiere (puoi dire 'virgola', 'punto', 'a capo', 'punto e a capo')…"
              onChange={(e) => updateNoteField('body', e.target.value)}
            />

            {speech.isListening ? (
              <div className="note-interim-box" aria-live="polite">
                <span className="mic-pulse-dot" aria-hidden="true" />
                <span>
                  {speech.interimTranscript || 'In ascolto… parla pure vicino al microfono.'}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}