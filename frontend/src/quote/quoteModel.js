import { todayIso } from '../lib/format';
import { supabase } from '../lib/supabase';

/** Anagrafica emittente di partenza (modificabile e persistita). */
export const DEFAULT_ISSUER = {
  name: 'CRI.MA. IMPIANTI S.R.L.',
  address: 'Via Gabrio Casati 15, 00012 Guidonia (RM)',
  vat: '17953441007',
  email: 'info.crimaimpianti@gmail.com',
  phone: '+39 348 3352372',
  logo_text: 'CM',
};

export const SALUTATIONS = ['SPETT.LE', 'SPETT.LE DITTA', 'GENT.MO', 'Egr. Sig.', 'Egr. Dott.'];

export const DEFAULT_AMOUNT_NOTE = '+ IVA';

export const AMOUNT_NOTE_PRESETS = [
  '+ IVA',
  'IVA inclusa',
  '+ IVA cadauno',
  '+ IVA al metro lineare',
  '+ IVA al 10%',
  'fuori campo IVA',
  'prezzo a corpo',
];

export const PAYMENT_PRESETS = [
  {
    label: '30% acconto',
    value: '30% all’ordine\nSaldo fine lavori',
  },
  {
    label: 'A SAL',
    value: '30% inizio lavori\n30% schemature ultimate\n20% montaggi\nSaldo al collaudo',
  },
  {
    label: 'Bonifico 30 gg',
    value: 'Bonifico bancario a 30 giorni data fattura',
  },
];

export const NOTE_PRESETS = [
  {
    label: 'Area libera',
    value:
      'L’area di lavoro deve essere lasciata completamente libera da cose e persone per tutta la durata dell’intervento.',
  },
  {
    label: 'Soggetto a revisione',
    value: 'Il presente preventivo è da ritenersi indicativo e soggetto a revisione.',
  },
  {
    label: 'Opere edili escluse',
    value: 'Sono escluse dal presente preventivo tutte le opere edili e murarie.',
  },
];

export const SECTION_TITLE_PRESETS = [
  'IMPIANTO IDRAULICO',
  'CLIMATIZZAZIONE',
  'FORNITURA E INSTALLAZIONE CLIMATIZZATORI',
  'LAVORAZIONI AL METRO',
  'OPZIONE 1',
];

const LAST_QUOTE_NUM_KEY = 'crima_last_quote_number';
const ARCHIVE_STORAGE_KEY = 'crima_quotes_archive';

let idCounter = 0;

export function makeId(prefix = 'row') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function getNextQuoteNumber() {
  if (typeof window === 'undefined') return '1';
  const last = localStorage.getItem(LAST_QUOTE_NUM_KEY);
  if (!last || !last.trim()) return '1';

  const match = last.trim().match(/^(\d+)(.*)$/);
  if (!match) return last;
  const nextInt = parseInt(match[1], 10) + 1;
  const padded = String(nextInt).padStart(match[1].length, '0');
  return `${padded}${match[2] || ''}`;
}

export function saveLastQuoteNumber(quoteNumber) {
  if (typeof window === 'undefined') return;
  const cleaned = String(quoteNumber || '').trim();
  if (cleaned) {
    localStorage.setItem(LAST_QUOTE_NUM_KEY, cleaned);
  }
}

export function createEmptyClient() {
  return {
    salutation: 'SPETT.LE',
    name: '',
    address: '',
    cap: '',
    city: '',
    province: '',
    email: '',
    phone: '',
    tax_id: '',
  };
}

export function createEmptySection(title = '') {
  return {
    id: makeId('sec'),
    title,
    is_optional: false,
    body: '',
    section_notes: '',
    notes_position: 'above',
    amount: '',
    amount_note: DEFAULT_AMOUNT_NOTE,
    lines: [],
  };
}

export function createEmptyQuote() {
  return {
    id: makeId('quote'),
    quote_number: getNextQuoteNumber(),
    date: todayIso(),
    object_title: '',
    payment_terms: '',
    notes: '',
    show_total: false,
    issuer: { ...DEFAULT_ISSUER },
    client: createEmptyClient(),
    sections: [createEmptySection('Preventivo di spesa')],
  };
}

export function formatClientAddress(client) {
  if (!client) return '';
  const parts = [
    client.address,
    [client.cap, client.city].filter(Boolean).join(' '),
    client.province ? `(${client.province})` : '',
  ];
  return parts.filter((part) => part && String(part).trim()).join(', ').replace(', (', ' (');
}

export function clientLabel(client) {
  return (client?.name || '').trim() || 'Cliente senza nome';
}

export function clientSubLabel(client) {
  return formatClientAddress(client) || client?.tax_id || '';
}

export function createEmptyLine() {
  return {
    id: makeId('line'),
    description: '',
    quantity: 1,
    unit_price: '',
  };
}

/** Legge tutti i preventivi da Supabase (con backup locale se offline). */
export async function getSavedQuotes() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('data, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const list = data
          .filter((row) => row && row.data)
          .map((row) => ({ ...row.data, updated_at: row.updated_at }));
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.error('Errore lettura Supabase:', err);
    }
  }

  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Calcola il prossimo numero preventivo leggendo il massimo da Supabase. */
export async function fetchNextQuoteNumber() {
  const list = await getSavedQuotes();
  let maxNum = 0;

  list.forEach((q) => {
    const match = String(q?.quote_number || '').trim().match(/^(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  if (maxNum > 0) {
    saveLastQuoteNumber(String(maxNum));
    return String(maxNum + 1);
  }
  return getNextQuoteNumber();
}

/** Salva o aggiorna un preventivo su Supabase e in locale. */
export async function saveQuoteToArchive(quote, totalAmount = 0) {
  const entry = {
    ...quote,
    id: quote.id || makeId('quote'),
    updated_at: new Date().toISOString(),
  };

  if (entry.quote_number) {
    saveLastQuoteNumber(entry.quote_number);
  }

  // Salva subito anche in locale
  try {
    const currentLocal = JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY) || '[]');
    const idx = currentLocal.findIndex((item) => item.id === entry.id);
    if (idx >= 0) currentLocal[idx] = entry;
    else currentLocal.unshift(entry);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(currentLocal));
  } catch {
    // ignore
  }

  if (supabase) {
    const { error } = await supabase.from('quotes').upsert(
      {
        id: entry.id,
        quote_number: String(entry.quote_number || '').trim(),
        date: String(entry.date || ''),
        client_name: String(entry.client?.name || '').trim(),
        object_title: String(entry.object_title || '').trim(),
        total: Number(totalAmount) || 0,
        data: entry,
        updated_at: entry.updated_at,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.error('Errore salvataggio Supabase:', error);
    }
  }

  return await getSavedQuotes();
}

/** Elimina un preventivo da Supabase e dalla copia locale. */
export async function deleteQuoteFromArchive(quoteId) {
  if (supabase) {
    await supabase.from('quotes').delete().eq('id', quoteId);
  }
  try {
    const local = JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY) || '[]').filter(
      (item) => item.id !== quoteId
    );
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(local));
  } catch {
    // ignore
  }
  return await getSavedQuotes();
}

/** Scarica il preventivo come file .json sul PC. */
export function exportQuoteToFile(quote) {
  const safeNum = (quote.quote_number || 'bozza').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeClient = (quote.client?.name || 'cliente').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Preventivo_${safeNum}_${safeClient}.json`;

  const blob = new Blob([JSON.stringify(quote, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}