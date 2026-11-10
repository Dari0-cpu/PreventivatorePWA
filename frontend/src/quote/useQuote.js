import { useCallback, useEffect, useMemo, useState } from 'react';
import { createEmptyQuote, createEmptySection, createEmptyLine } from './quoteModel';
import {
  loadDraft,
  saveDraft,
  loadIssuer,
  saveIssuer,
  loadClients,
  saveClientToDirectory,
  removeClientFromDirectory,
} from '../lib/storage';
import { computeQuoteTotals } from '../lib/totals';

const AUTOSAVE_DELAY = 400;

/** Ricostruisce un preventivo coerente anche se la bozza salvata è parziale. */
function hydrateQuote(draft, issuer) {
  const base = createEmptyQuote();
  if (!draft) return { ...base, issuer: issuer || base.issuer };

  const sections =
    Array.isArray(draft.sections) && draft.sections.length > 0
      ? draft.sections.map((section) => ({
          ...section,
          lines:
            Array.isArray(section.lines) && section.lines.length > 0
              ? section.lines
              : [createEmptyLine()],
        }))
      : base.sections;

  return {
    ...base,
    ...draft,
    issuer: draft.issuer || issuer || base.issuer,
    client: { ...base.client, ...(draft.client || {}) },
    sections,
  };
}

export function useQuote() {
  const [quote, setQuote] = useState(() => hydrateQuote(loadDraft(), loadIssuer()));
  const [clients, setClients] = useState(() => loadClients());
  const [savedAt, setSavedAt] = useState(null);

  // --- Autosalvataggio offline-first ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (saveDraft(quote)) setSavedAt(new Date());
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [quote]);

  useEffect(() => {
    saveIssuer(quote.issuer);
  }, [quote.issuer]);

  // --- Testata ---
  const setField = useCallback((field, value) => {
    setQuote((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setClientField = useCallback((field, value) => {
    setQuote((prev) => ({ ...prev, client: { ...prev.client, [field]: value } }));
  }, []);

  const setIssuerField = useCallback((field, value) => {
    setQuote((prev) => ({ ...prev, issuer: { ...prev.issuer, [field]: value } }));
  }, []);

  const applyClient = useCallback((client) => {
    setQuote((prev) => ({ ...prev, client: { ...prev.client, ...client } }));
  }, []);

  const rememberClient = useCallback(() => {
    setClients(saveClientToDirectory(quote.client));
  }, [quote.client]);

  const forgetClient = useCallback((name) => {
    setClients(removeClientFromDirectory(name));
  }, []);

  // --- Testi liberi (pagamento / note) ---
  const appendText = useCallback((field, text) => {
    setQuote((prev) => {
      const current = prev[field] ? prev[field].trimEnd() : '';
      return { ...prev, [field]: current ? `${current}\n${text}` : text };
    });
  }, []);
// --- Sezioni ---
  const addSection = useCallback(() => {
    setQuote((prev) => ({ ...prev, sections: [...prev.sections, createEmptySection()] }));
  }, []);

  const updateSection = useCallback((sectionId, field, value) => {
    setQuote((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    }));
  }, []);

  const removeSection = useCallback((sectionId) => {
    setQuote((prev) => {
      if (prev.sections.length <= 1) return prev;
      return { ...prev, sections: prev.sections.filter((section) => section.id !== sectionId) };
    });
  }, []);

  const moveSection = useCallback((sectionId, direction) => {
    setQuote((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      const [moved] = sections.splice(index, 1);
      sections.splice(target, 0, moved);
      return { ...prev, sections };
    });
  }, []);

  // --- Righe ---
  const addLine = useCallback((sectionId) => {
    setQuote((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, lines: [...section.lines, createEmptyLine()] }
          : section,
      ),
    }));
  }, []);

  const updateLine = useCallback((sectionId, lineId, field, value) => {
    setQuote((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lines: section.lines.map((line) =>
                line.id === lineId ? { ...line, [field]: value } : line,
              ),
            }
          : section,
      ),
    }));
  }, []);

  const duplicateLine = useCallback((sectionId, lineId) => {
    setQuote((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.lines.findIndex((line) => line.id === lineId);
        if (index < 0) return section;
        const copy = { ...section.lines[index], id: createEmptyLine().id };
        const lines = [...section.lines];
        lines.splice(index + 1, 0, copy);
        return { ...section, lines };
      }),
    }));
  }, []);

  const removeLine = useCallback((sectionId, lineId) => {
    setQuote((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const remaining = section.lines.filter((line) => line.id !== lineId);
        return { ...section, lines: remaining.length > 0 ? remaining : [createEmptyLine()] };
      }),
    }));
  }, []);

  // --- Nuovo preventivo (mantiene l'anagrafica emittente) ---
  const startNewQuote = useCallback(() => {
    setQuote((prev) => ({ ...createEmptyQuote(), issuer: prev.issuer }));
  }, []);

  const totals = useMemo(() => computeQuoteTotals(quote.sections), [quote.sections]);

  return {
    quote,
    clients,
    totals,
    savedAt,
    setField,
    setClientField,
    setIssuerField,
    applyClient,
    rememberClient,
    forgetClient,
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
  };
}
