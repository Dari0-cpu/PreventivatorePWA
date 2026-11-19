import { supabase } from '../lib/supabase';
import { createEmptyClient, makeId } from '../quote/quoteModel';

const NOTES_STORAGE_KEY = 'crima_notes_archive';

export function createEmptyNote() {
  const now = new Date().toISOString();
  return {
    id: makeId('note'),
    client: createEmptyClient(),
    title: '',
    body: '',
    created_at: now,
    updated_at: now,
  };
}

/** Formatta una data ISO in gg/mm/aaaa hh:mm per la lista note. */
export function formatNoteTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Converte testo semplice della nota in HTML sicuro per l'editor del preventivo. */
export function noteBodyToQuoteHtml(body) {
  if (!body || !body.trim()) return '';
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<div>${line}</div>` : '<div><br></div>'))
    .join('');
}

function readLocalNotes() {
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalNotes(list) {
  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage non disponibile */
  }
}

/** Legge tutte le note da Supabase con fallback offline su localStorage. */
export async function getSavedNotes() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('data, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const list = data
          .filter((row) => row && row.data)
          .map((row) => ({
            ...row.data,
            created_at: row.created_at || row.data.created_at,
            updated_at: row.updated_at || row.data.updated_at,
          }));
        writeLocalNotes(list);
        return list;
      }
    } catch (err) {
      console.error('Errore lettura note Supabase:', err);
    }
  }

  return readLocalNotes();
}

/** Salva o aggiorna una nota in locale e su Supabase. */
export async function saveNoteToArchive(note) {
  const now = new Date().toISOString();
  const entry = {
    ...note,
    id: note.id || makeId('note'),
    client: { ...createEmptyClient(), ...(note.client || {}) },
    created_at: note.created_at || now,
    updated_at: now,
  };

  const currentLocal = readLocalNotes();
  const idx = currentLocal.findIndex((item) => item.id === entry.id);
  if (idx >= 0) currentLocal[idx] = entry;
  else currentLocal.unshift(entry);
  writeLocalNotes(currentLocal);

  if (supabase) {
    const { error } = await supabase.from('notes').upsert(
      {
        id: entry.id,
        client_name: String(entry.client?.name || '').trim(),
        title: String(entry.title || '').trim(),
        data: entry,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.error('Errore salvataggio nota Supabase:', error);
    }
  }

  return await getSavedNotes();
}

/** Elimina una nota da Supabase e dal backup locale. */
export async function deleteNoteFromArchive(noteId) {
  if (supabase) {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) {
      console.error('Errore eliminazione nota Supabase:', error);
    }
  }

  const nextLocal = readLocalNotes().filter((item) => item.id !== noteId);
  writeLocalNotes(nextLocal);
  return await getSavedNotes();
}

/** Livello 2 opzionale: chiama la Supabase Edge Function "polish-note". */
export async function polishNoteTextWithAI(rawText) {
  if (!supabase) {
    throw new Error('Supabase non configurato.');
  }
  const { data, error } = await supabase.functions.invoke('polish-note', {
    body: { text: rawText },
  });
  if (error) {
    throw new Error(error.message || 'Servizio AI non disponibile.');
  }
  if (!data || typeof data.text !== 'string') {
    throw new Error('Risposta non valida dal servizio AI.');
  }
  return data.text;
}