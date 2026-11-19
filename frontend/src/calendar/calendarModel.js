import { supabase } from '../lib/supabase';
import { todayIso } from '../lib/format';
import { makeId } from '../quote/quoteModel';

const CALENDAR_STORAGE_KEY = 'crima_calendar_events';

export const EVENT_TITLE_PRESETS = [
  'Sopralluogo',
  'Consegna preventivo',
  'Inizio lavori',
  'Assistenza',
];

export function createEmptyEvent(date = todayIso(), prefill = {}) {
  return {
    id: makeId('evt'),
    date: date || todayIso(),
    time: '',
    title: prefill.title || '',
    client_name: prefill.client_name || '',
    address: prefill.address || '',
    phone: prefill.phone || '',
    notes: prefill.notes || '',
    done: false,
    updated_at: new Date().toISOString(),
  };
}

/** Ordina gli impegni del giorno: quelli senza orario in cima, poi in ordine crescente. */
export function sortEventsByTime(events) {
  return [...events].sort((a, b) => {
    const timeA = (a.time || '').trim();
    const timeB = (b.time || '').trim();
    if (!timeA && !timeB) return (a.title || '').localeCompare(b.title || '');
    if (!timeA) return -1;
    if (!timeB) return 1;
    return timeA.localeCompare(timeB);
  });
}

function readLocalEvents() {
  try {
    const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalEvents(list) {
  try {
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage non disponibile */
  }
}

/** Legge tutti gli appuntamenti da Supabase con fallback su localStorage. */
export async function getCalendarEvents() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('data, done, updated_at')
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (!error && Array.isArray(data)) {
        const list = data
          .filter((row) => row && row.data)
          .map((row) => ({
            ...row.data,
            done: Boolean(row.done),
            updated_at: row.updated_at || row.data.updated_at,
          }));
        writeLocalEvents(list);
        return list;
      }
    } catch (err) {
      console.error('Errore lettura calendario Supabase:', err);
    }
  }

  return readLocalEvents();
}

/** Salva o aggiorna un impegno in locale e su Supabase. */
export async function saveCalendarEvent(eventData) {
  const entry = {
    ...eventData,
    id: eventData.id || makeId('evt'),
    date: String(eventData.date || todayIso()),
    time: String(eventData.time || '').trim(),
    title: String(eventData.title || '').trim(),
    client_name: String(eventData.client_name || '').trim(),
    address: String(eventData.address || '').trim(),
    phone: String(eventData.phone || '').trim(),
    notes: String(eventData.notes || '').trim(),
    done: Boolean(eventData.done),
    updated_at: new Date().toISOString(),
  };

  const currentLocal = readLocalEvents();
  const idx = currentLocal.findIndex((item) => item.id === entry.id);
  if (idx >= 0) currentLocal[idx] = entry;
  else currentLocal.push(entry);
  writeLocalEvents(currentLocal);

  if (supabase) {
    const { error } = await supabase.from('calendar_events').upsert(
      {
        id: entry.id,
        event_date: entry.date,
        event_time: entry.time,
        client_name: entry.client_name,
        done: entry.done,
        data: entry,
        updated_at: entry.updated_at,
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.error('Errore salvataggio evento Supabase:', error);
    }
  }

  return await getCalendarEvents();
}

/** Aggiorna lo stato completato (done) di un impegno. */
export async function toggleCalendarEventDone(eventItem, done) {
  return await saveCalendarEvent({ ...eventItem, done: Boolean(done) });
}

/** Elimina un impegno da Supabase e dal backup locale. */
export async function deleteCalendarEvent(eventId) {
  if (supabase) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    if (error) {
      console.error('Errore eliminazione evento Supabase:', error);
    }
  }

  const nextLocal = readLocalEvents().filter((item) => item.id !== eventId);
  writeLocalEvents(nextLocal);
  return await getCalendarEvents();
}