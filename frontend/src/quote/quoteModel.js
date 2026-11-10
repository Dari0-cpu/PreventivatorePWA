import { todayIso } from '../lib/format';

/** Anagrafica emittente di partenza (modificabile e persistita). */
export const DEFAULT_ISSUER = {
  name: 'CRI.MA IMPIANTI S.R.L.',
  address: 'Via Gabrio Casati 15, 00012 Guidonia (RM)',
  vat: '17953441007',
  email: 'info.crimaimpianti@gmail.com',
  phone: '+39 348 3352372',
  logo_text: 'CM',
};

/** Intestazioni di cortesia usate nei preventivi reali. */
export const SALUTATIONS = ['SPETT.LE', 'SPETT.LE DITTA', 'GENT.MO', 'Egr. Sig.', 'Egr. Dott.'];

/** Etichetta predefinita accanto all'importo: la IVA la scrivi tu. */
export const DEFAULT_AMOUNT_NOTE = '+ IVA';

/** Diciture pronte per l'importo: restano modificabili a mano. */
export const AMOUNT_NOTE_PRESETS = [
  '+ IVA',
  'IVA inclusa',
  '+ IVA cadauno',
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
      'NOTA BENE:\nL’area di lavoro deve essere lasciata completamente libera da cose e persone per tutta la durata dell’intervento.',
  },
  {
    label: 'Soggetto a revisione',
    value: 'NOTA BENE:\nIl presente preventivo è da ritenersi indicativo e soggetto a revisione.',
  },
  {
    label: 'Opere edili escluse',
    value: 'NOTA BENE:\nSono escluse dal presente preventivo tutte le opere edili e murarie.',
  },
];

/** Titoli sezione suggeriti: restano semplici chip, il campo è libero. */
export const SECTION_TITLE_PRESETS = [
  'Preventivo di spesa',
  'OPZIONE 1',
  'OPZIONE 2',
  'Ricambio Aria',
  'Manodopera',
];

let idCounter = 0;

/** ID stabile per la UI, con fallback se crypto.randomUUID non è disponibile. */
export function makeId(prefix = 'row') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
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

/**
 * Una sezione = un blocco di testo libero (con elenchi, grassetti, sottolineature)
 * + un importo scelto da te + la dicitura che scrivi tu accanto (es. "+ IVA").
 */
export function createEmptySection(title = '') {
  return {
    id: makeId('sec'),
    title,
    is_optional: false,
    body: '',
    amount: '',
    amount_note: DEFAULT_AMOUNT_NOTE,
  };
}

export function createEmptyQuote() {
  return {
    id: makeId('quote'),
    quote_number: '',
    date: todayIso(),
    object_title: '',
    payment_terms: '',
    notes: '',
    issuer: { ...DEFAULT_ISSUER },
    client: createEmptyClient(),
    sections: [createEmptySection('Preventivo di spesa')],
  };
}

/** Indirizzo del cliente su una riga sola, come nei documenti reali. */
export function formatClientAddress(client) {
  const parts = [
    client.address,
    [client.cap, client.city].filter(Boolean).join(' '),
    client.province ? `(${client.province})` : '',
  ];
  return parts.filter((part) => part && String(part).trim()).join(', ').replace(', (', ' (');
}

/** Etichetta compatta per la rubrica e per i suggerimenti. */
export function clientLabel(client) {
  return (client.name || '').trim() || 'Cliente senza nome';
}

/** Riga descrittiva dei suggerimenti: indirizzo o città. */
export function clientSubLabel(client) {
  return formatClientAddress(client) || client.tax_id || '';
}

/** Mantenuta per compatibilità con useQuote.js */
export function createEmptyLine() {
  return {
    id: makeId('line'),
    description: '',
    quantity: 1,
    unit_price: '',
  };
}