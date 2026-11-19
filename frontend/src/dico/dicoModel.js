import { supabase } from '../lib/supabase';
import { todayIso } from '../lib/format';
import { createEmptyClient, makeId } from '../quote/quoteModel';
import { CAD_SYMBOLS, PIPE_TYPES } from './cad/symbols';

const DICO_STORAGE_KEY = 'crima_dico_archive';
const DICO_RT_KEY = 'crima_dico_rt_defaults';

export const DM37_LETTERS = [
  { code: 'c', label: 'c) Riscaldamento, climatizzazione, condizionamento e refrigerazione' },
  { code: 'd', label: 'd) Impianti idrici e sanitari di qualsiasi natura o specie' },
  { code: 'e', label: 'e) Impianti per la distribuzione e l’utilizzazione di gas' },
  { code: 'a', label: 'a) Impianti di produzione, trasformazione, trasporto e distribuzione energia elettrica' },
  { code: 'b', label: 'b) Impianti radiotelevisivi, antenne e impianti elettronici' },
  { code: 'f', label: 'f) Impianti di sollevamento di persone o di cose' },
  { code: 'g', label: 'g) Impianti di protezione antincendio' },
];

export const INTERVENTION_TYPES = [
  { id: 'nuovo', label: 'Nuovo impianto' },
  { id: 'trasformazione', label: 'Trasformazione' },
  { id: 'ampliamento', label: 'Ampliamento' },
  { id: 'manutenzione_straordinaria', label: 'Manutenzione straordinaria' },
  { id: 'altro', label: 'Altro' },
];

export const BUILDING_USES = [
  { id: 'civile', label: 'Civile' },
  { id: 'commercio', label: 'Commercio' },
  { id: 'industriale', label: 'Industriale' },
  { id: 'altri_usi', label: 'Altri usi' },
];

export const COPY_TARGETS = ['Committente', 'Ditta', 'Comune / Sportello Unico', 'CCIAA'];

export const NORM_PRESETS = [
  'UNI EN 378-3 (Impianti di refrigerazione e pompe di calore)',
  'UNI 7129:2015 (Impianti gas < 35 kW)',
  'UNI 7131:2014 (Impianti GPL)',
  'UNI 11528:2022 (Impianti gas > 35 kW)',
  'UNI 9182:2014 (Impianti idrico-sanitari)',
  'UNI EN 806 (Acqua potabile)',
  'UNI 10412 (Impianti di riscaldamento)',
  'UNI EN 12828 (Sistemi di riscaldamento)',
  'UNI 10845 (Sistemi evacuazione fumi)',
  'CEI 64-8 (Impianti elettrici BT)',
];

export const DEFAULT_RT = {
  titolare: '',
  responsabile_tecnico: '',
  qualifica: 'Responsabile Tecnico',
  cciaa_provincia: 'Roma',
  cciaa_numero: '',
  albo_artigiani: '',
};

export function loadSavedRtDefaults() {
  try {
    const raw = window.localStorage.getItem(DICO_RT_KEY);
    if (!raw) return { ...DEFAULT_RT };
    return { ...DEFAULT_RT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_RT };
  }
}

export function saveRtDefaults(rtData) {
  try {
    window.localStorage.setItem(DICO_RT_KEY, JSON.stringify(rtData));
  } catch {
    /* ignore */
  }
}

export function createEmptyDrawing() {
  return {
    width: 1000,
    height: 640,
    gridSize: 20,
    metersPerCell: 0.25,
    backgroundImage: '',
    backgroundOpacity: 0.35,
    elements: [],
  };
}

export function createEmptyMaterialRow(overrides = {}) {
  return {
    id: makeId('mat'),
    location: '',
    code: '',
    description: '',
    brand: '',
    serial: '',
    material: '',
    qty: '1',
    dimension: '',
    length: '',
    posa: '',
    norm: 'Marcatura CE',
    fromCad: false,
    cadId: '',
    ...overrides,
  };
}

export function createEmptyDico(dicoNumber = '1') {
  const now = new Date().toISOString();
  const rt = loadSavedRtDefaults();
  return {
    id: makeId('dico'),
    dico_number: String(dicoNumber || '1'),
    date: todayIso(),
    copy_for: 'Committente',
    rt,
    client: createEmptyClient(),
    same_owner: true,
    owner_name: '',
    owner_address: '',
    location: {
      address: '',
      civico: '',
      cap: '',
      city: '',
      province: 'RM',
      scala: '',
      piano: '',
      interno: '',
      sezione: '',
      foglio: '',
      particella: '',
      subalterno: '',
    },
    building_use: 'civile',
    letters: ['c', 'd'],
    intervention_type: 'nuovo',
    intervention_other: '',
    impianto_descrizione: '',
    project_respected: false,
    project_author: '',
    norms: 'UNI 9182:2014 (Impianti idrico-sanitari)\nUNI 10412 (Impianti di riscaldamento)',
    relazione_schematica: {
      pdr: '',
      nuovo_impianto: true,
      modifica_esistente: false,
      installazione_apparecchi: true,
      installazione_tubazione: true,
      collegamento_canna_fumaria: false,
      aperture_ventilazione: false,
      aperture_aerazione: false,
      potenza_kw: '',
      esecuzione_progetto: false,
      esecuzione_installatore: true,
      altro_testo: '',
    },
    attachments: {
      progetto: false,
      relazione_materiali: true,
      schema_impianto: true,
      riferimento_dico_precedenti: false,
      visura_camerale: true,
      attestazione_non_normalizzati: false,
      relazione_fotografica: false,
      altri_allegati: '',
    },
    document_options: {
      include_cover: true,
      include_legenda: true,
      include_relazione_schematica: true,
      include_libretto: true,
      libretto_type: 'clima', // 'clima' | 'termico' | 'idrico_gas'
    },
    previous_dico_ref: '',
    notes: '',
    drawing: createEmptyDrawing(),
    materials: [],
    photos: [],
    created_at: now,
    updated_at: now,
  };
}

/** Calcola la lunghezza in metri di una polilinea (supporta sia points[] che x1/y1/x2/y2). */
export function computePipeMeters(pipe, gridSize = 20, metersPerCell = 0.25) {
  const pts =
    Array.isArray(pipe.points) && pipe.points.length >= 2
      ? pipe.points
      : [
          { x: pipe.x1 ?? 0, y: pipe.y1 ?? 0 },
          { x: pipe.x2 ?? 0, y: pipe.y2 ?? 0 },
        ];
  let totalPx = 0;
  for (let i = 1; i < pts.length; i += 1) {
    totalPx += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  const m = (totalPx / (gridSize || 20)) * (metersPerCell || 0.25);
  return Math.max(0.2, Math.round(m * 100) / 100);
}

/**
 * Sincronizza CAD -> Sez. III Materiali con corrispondenza 1-a-1 per sigla (P1, P2, P4...)
 * esattamente come mrDico, mantenendo Marca, Matricola e note già inserite.
 */
export function syncMaterialsFromCad(drawing, existingMaterials = []) {
  const elements = Array.isArray(drawing?.elements) ? drawing.elements : [];
  const manualRows = existingMaterials.filter((m) => !m.fromCad);
  const prevByCadId = new Map(
    existingMaterials.filter((m) => m.fromCad && m.cadId).map((m) => [m.cadId, m]),
  );

  const cadRows = [];

  elements.forEach((el) => {
    if (el.kind === 'symbol') {
      const def = CAD_SYMBOLS[el.symbolType];
      if (!def || def.isArchitectural) return;
      const existing = prevByCadId.get(el.id);
      cadRows.push(
        createEmptyMaterialRow({
          id: existing?.id || makeId('mat'),
          location: el.location || existing?.location || '',
          code: el.code || existing?.code || '',
          description: el.label || existing?.description || def.label,
          brand: existing?.brand || '',
          serial: existing?.serial || '',
          material: el.material || existing?.material || def.defaultMaterial || '',
          qty: existing?.qty || '1',
          dimension: el.diameter || existing?.dimension || def.defaultDimension || '',
          length: '',
          posa: el.posa || existing?.posa || def.defaultPosa || '',
          norm: existing?.norm || def.defaultNorm || 'Marcatura CE',
          fromCad: true,
          cadId: el.id,
        }),
      );
    } else if (el.kind === 'pipe') {
      const preset = PIPE_TYPES[el.pipeType] || PIPE_TYPES.acqua_fredda;
      const existing = prevByCadId.get(el.id);
      const len =
        Number(el.lengthMeters) ||
        computePipeMeters(el, drawing?.gridSize, drawing?.metersPerCell);
      cadRows.push(
        createEmptyMaterialRow({
          id: existing?.id || makeId('mat'),
          location: el.location || existing?.location || '',
          code: el.code || existing?.code || '',
          description: el.label || existing?.description || preset.defaultDescription || preset.label,
          brand: existing?.brand || '',
          serial: existing?.serial || '',
          material: el.material || preset.defaultMaterial || '',
          qty: '1',
          dimension: el.diameter || preset.defaultDiameter || '',
          length: len.toFixed(2).replace('.', ','),
          posa: el.posa || preset.defaultPosa || '',
          norm: existing?.norm || preset.defaultNorm || 'Marcatura CE',
          fromCad: true,
          cadId: el.id,
        }),
      );
    }
  });

  // Ordina per codice numerico (P1, P2, P4, P5...)
  cadRows.sort((a, b) => {
    const na = parseInt(String(a.code).replace(/\D+/g, ''), 10) || 9999;
    const nb = parseInt(String(b.code).replace(/\D+/g, ''), 10) || 9999;
    return na - nb;
  });

  return [...cadRows, ...manualRows];
}

/* =========================================================================
   MODELLI PREIMPOSTATI PRONTI IN 1 CLICK (stile libreria mrDico)
   ========================================================================= */
export const DICO_TEMPLATES = [
  {
    id: 'clima_mansarda',
    name: 'Climatizzazione (Split + Unità Esterna + Condensa)',
    subtitle: 'Lettera C · UNI EN 378-3 · Schema sezione completo',
    build: () => {
      const drawing = {
        width: 1000,
        height: 640,
        gridSize: 20,
        metersPerCell: 0.25,
        backgroundImage: '',
        backgroundOpacity: 0.35,
        elements: [
          // Solaio/pavimento tratteggiato
          { id: makeId('arch'), kind: 'hatchWall', x1: 40, y1: 580, x2: 960, y2: 580, thickness: 28 },
          // Muro verticale destro mansarda
          { id: makeId('arch'), kind: 'hatchWall', x1: 680, y1: 220, x2: 680, y2: 580, thickness: 26 },
          // Falda sinistra e falda destra tetto
          { id: makeId('arch'), kind: 'hatchWall', x1: 40, y1: 250, x2: 360, y2: 40, thickness: 18 },
          { id: makeId('arch'), kind: 'hatchWall', x1: 360, y1: 40, x2: 940, y2: 340, thickness: 18 },
          // Finestra e staffa tetto
          { id: makeId('sym'), kind: 'symbol', symbolType: 'finestra_prospetto', x: 400, y: 290, rotation: 0, scale: 1.4 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'staffa_tetto', x: 840, y: 260, rotation: 0, scale: 1.2 },
          // Impianto: P1 Split, P2 Unità esterna, P6 Pompa condensa
          { id: makeId('sym'), kind: 'symbol', symbolType: 'split_pavimento', code: 'P1', label: 'Split a pavimento', location: 'Mansarda', x: 400, y: 505, rotation: 0, scale: 1.25 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'unita_esterna', code: 'P2', label: 'Unità Esterna', location: 'Sul Tetto', x: 840, y: 195, rotation: 0, scale: 1.15 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'pompa_condensa', code: 'P6', label: 'Pompa scarico condensa', location: 'Mansarda', x: 750, y: 550, rotation: 0, scale: 1, posa: 'A vista' },
          // Tubazioni polilinea: P4 Rame liquido, P5 Rame gas, P7 e P8 condensa
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'frigo_mandata',
            code: 'P4',
            location: 'Mansarda',
            label: 'Tubo in Rame isolato UNI EN 12735-1 per condiz.',
            material: 'Rame',
            diameter: '1/4"',
            posa: 'In Canaletta',
            lengthMeters: 3.61,
            points: [
              { x: 446, y: 528 },
              { x: 446, y: 538 },
              { x: 706, y: 538 },
              { x: 706, y: 270 },
              { x: 780, y: 240 },
              { x: 828, y: 240 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'frigo_ritorno',
            code: 'P5',
            location: 'Mansarda',
            label: 'Tubo in Rame isolato UNI EN 12735-1 per condiz.',
            material: 'Rame',
            diameter: '3/8"',
            posa: 'In Canaletta',
            lengthMeters: 3.64,
            points: [
              { x: 432, y: 528 },
              { x: 432, y: 548 },
              { x: 728, y: 548 },
              { x: 728, y: 290 },
              { x: 790, y: 248 },
              { x: 845, y: 248 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'condensa',
            code: 'P7',
            location: 'Mansarda',
            label: 'Tubo in Gomma scarico condensa',
            material: 'Gomma',
            diameter: '1/4"',
            posa: 'In Canaletta',
            lengthMeters: 1.63,
            points: [
              { x: 416, y: 528 },
              { x: 416, y: 558 },
              { x: 734, y: 558 },
              { x: 734, y: 550 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'condensa',
            code: 'P8',
            location: 'Tetto',
            label: 'Tubo in Gomma scarico condensa',
            material: 'Gomma',
            diameter: '1/4"',
            posa: 'In Canaletta',
            lengthMeters: 2.11,
            points: [
              { x: 766, y: 550 },
              { x: 766, y: 270 },
              { x: 800, y: 256 },
            ],
          },
        ],
      };

      return {
        letters: ['c'],
        intervention_type: 'nuovo',
        impianto_descrizione: 'Nuovo impianto di condizionamento in civile abitazione.',
        norms: 'UNI EN 378-3 (Impianti di refrigerazione e pompe di calore)',
        relazione_schematica: {
          pdr: '',
          nuovo_impianto: true,
          modifica_esistente: false,
          installazione_apparecchi: true,
          installazione_tubazione: true,
          collegamento_canna_fumaria: false,
          aperture_ventilazione: false,
          aperture_aerazione: false,
          potenza_kw: '',
          esecuzione_progetto: false,
          esecuzione_installatore: true,
          altro_testo: 'Installazione ed allacciamento di Split ed Unità Esterna.',
        },
        document_options: {
          include_cover: true,
          include_legenda: true,
          include_relazione_schematica: true,
          include_libretto: true,
          libretto_type: 'clima',
        },
        drawing,
        materials: syncMaterialsFromCad(drawing, []),
      };
    },
  },
  {
    id: 'caldaia_gas',
    name: 'Caldaia a Condensazione + Impianto Termico & Gas',
    subtitle: 'Lettere C, E · UNI 7129:2015 + UNI 10412',
    build: () => {
      const drawing = {
        width: 1000,
        height: 640,
        gridSize: 20,
        metersPerCell: 0.25,
        backgroundImage: '',
        backgroundOpacity: 0.35,
        elements: [
          { id: makeId('arch'), kind: 'room', x1: 120, y1: 100, x2: 520, y2: 520, label: 'Cucina / Centrale' },
          { id: makeId('arch'), kind: 'room', x1: 520, y1: 100, x2: 880, y2: 520, label: 'Zona Giorno' },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'contatore_gas', code: 'P1', label: 'Contatore Gas', location: 'Esterno', x: 60, y: 200, rotation: 0, scale: 1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'valvola_gas', code: 'P2', label: 'Valvola intercettazione Gas', location: 'Cucina', x: 180, y: 200, rotation: 0, scale: 1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'caldaia', code: 'P3', label: 'Caldaia a condensazione 24 kW', location: 'Cucina', x: 300, y: 180, rotation: 0, scale: 1.1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'scarico_fumi', code: 'P4', label: 'Scarico fumi coassiale Ø60/100', location: 'Parete est.', x: 300, y: 120, rotation: 0, scale: 1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'collettore_termico', code: 'P5', label: 'Collettore riscaldamento', location: 'Cucina', x: 300, y: 340, rotation: 0, scale: 1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'radiatore', code: 'P6', label: 'Radiatore Zona Giorno', location: 'Zona Giorno', x: 700, y: 220, rotation: 0, scale: 1.1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'radiatore', code: 'P7', label: 'Radiatore Soggiorno', location: 'Zona Giorno', x: 700, y: 420, rotation: 0, scale: 1.1 },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'gas',
            code: 'P8',
            location: 'Cucina',
            label: 'Tubazione Gas in Rame UNI 7129',
            material: 'Rame',
            diameter: 'Ø22',
            posa: 'A vista / in guaina',
            lengthMeters: 4.5,
            points: [
              { x: 78, y: 200 },
              { x: 164, y: 200 },
              { x: 196, y: 200 },
              { x: 288, y: 200 },
              { x: 288, y: 210 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'mandata',
            code: 'P9',
            location: 'Zona Giorno',
            label: 'Tubazione Mandata riscaldamento',
            material: 'Multistrato',
            diameter: 'Ø20',
            posa: 'Sottotraccia isolata',
            lengthMeters: 8.5,
            points: [
              { x: 328, y: 335 },
              { x: 600, y: 335 },
              { x: 600, y: 212 },
              { x: 670, y: 212 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'ritorno',
            code: 'P10',
            location: 'Zona Giorno',
            label: 'Tubazione Ritorno riscaldamento',
            material: 'Multistrato',
            diameter: 'Ø20',
            posa: 'Sottotraccia isolata',
            lengthMeters: 9.0,
            points: [
              { x: 328, y: 345 },
              { x: 620, y: 345 },
              { x: 620, y: 428 },
              { x: 670, y: 428 },
            ],
          },
        ],
      };

      return {
        letters: ['c', 'e'],
        intervention_type: 'nuovo',
        impianto_descrizione:
          'Installazione caldaia murale a condensazione, linea adduzione gas metano 2a famiglia e distribuzione riscaldamento.',
        norms: 'UNI 7129:2015 (Impianti gas < 35 kW)\nUNI 10412 (Impianti di riscaldamento)',
        relazione_schematica: {
          pdr: '',
          nuovo_impianto: true,
          modifica_esistente: false,
          installazione_apparecchi: true,
          installazione_tubazione: true,
          collegamento_canna_fumaria: true,
          aperture_ventilazione: true,
          aperture_aerazione: false,
          potenza_kw: '24',
          esecuzione_progetto: false,
          esecuzione_installatore: true,
          altro_testo: 'Installazione generatore a condensazione e prova di tenuta impianto gas.',
        },
        document_options: {
          include_cover: true,
          include_legenda: true,
          include_relazione_schematica: true,
          include_libretto: true,
          libretto_type: 'termico',
        },
        drawing,
        materials: syncMaterialsFromCad(drawing, []),
      };
    },
  },
  {
    id: 'bagno_idrico',
    name: 'Rifacimento Impianto Idrico-Sanitario Bagno',
    subtitle: 'Lettera D · UNI 9182:2014 · Collettore + Sanitari + Scarichi',
    build: () => {
      const drawing = {
        width: 1000,
        height: 640,
        gridSize: 20,
        metersPerCell: 0.25,
        backgroundImage: '',
        backgroundOpacity: 0.35,
        elements: [
          { id: makeId('arch'), kind: 'room', x1: 160, y1: 100, x2: 840, y2: 540, label: 'Bagno Principale' },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'collettore_sanitario', code: 'P1', label: 'Collettore idrico-sanitario', location: 'Bagno', x: 240, y: 180, rotation: 0, scale: 1.1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'lavabo', code: 'P2', label: 'Lavabo bagno', location: 'Bagno', x: 460, y: 150, rotation: 0, scale: 1.1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'wc', code: 'P3', label: 'Vaso WC + cassetta incasso', location: 'Bagno', x: 640, y: 155, rotation: 0, scale: 1.1 },
          { id: makeId('sym'), kind: 'symbol', symbolType: 'doccia', code: 'P4', label: 'Box doccia', location: 'Bagno', x: 760, y: 440, rotation: 0, scale: 1.2 },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'acqua_fredda',
            code: 'P5',
            location: 'Bagno',
            label: 'Linea acqua fredda sanitaria',
            material: 'Multistrato',
            diameter: 'Ø16',
            posa: 'Sottotraccia isolata',
            lengthMeters: 7.2,
            points: [
              { x: 268, y: 185 },
              { x: 460, y: 185 },
              { x: 460, y: 165 },
              { x: 640, y: 185 },
              { x: 760, y: 185 },
              { x: 760, y: 416 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'acqua_calda',
            code: 'P6',
            location: 'Bagno',
            label: 'Linea acqua calda sanitaria',
            material: 'Multistrato',
            diameter: 'Ø16',
            posa: 'Sottotraccia isolata',
            lengthMeters: 6.4,
            points: [
              { x: 268, y: 175 },
              { x: 448, y: 175 },
              { x: 745, y: 175 },
              { x: 745, y: 416 },
            ],
          },
          {
            id: makeId('pipe'),
            kind: 'pipe',
            pipeType: 'scarico',
            code: 'P7',
            location: 'Bagno',
            label: 'Collettore scarico acque reflue',
            material: 'PP insonorizzato',
            diameter: 'Ø50',
            posa: 'A pavimento',
            lengthMeters: 5.5,
            points: [
              { x: 460, y: 240 },
              { x: 640, y: 240 },
              { x: 640, y: 440 },
              { x: 736, y: 440 },
            ],
          },
        ],
      };

      return {
        letters: ['d'],
        intervention_type: 'rifacimento' === 'nuovo' ? 'nuovo' : 'manutenzione_straordinaria',
        impianto_descrizione:
          'Rifacimento completo impianto idrico-sanitario adduzione acqua calda/fredda e scarichi bagno.',
        norms: 'UNI 9182:2014 (Impianti idrico-sanitari)\nUNI EN 806 (Acqua potabile)',
        relazione_schematica: {
          pdr: '',
          nuovo_impianto: false,
          modifica_esistente: true,
          installazione_apparecchi: true,
          installazione_tubazione: true,
          collegamento_canna_fumaria: false,
          aperture_ventilazione: false,
          aperture_aerazione: false,
          potenza_kw: '',
          esecuzione_progetto: false,
          esecuzione_installatore: true,
          altro_testo: 'Rifacimento completo distribuzione da collettore e rete di scarico.',
        },
        document_options: {
          include_cover: true,
          include_legenda: true,
          include_relazione_schematica: true,
          include_libretto: true,
          libretto_type: 'idrico_gas',
        },
        drawing,
        materials: syncMaterialsFromCad(drawing, []),
      };
    },
  },
];

function readLocalDicos() {
  try {
    const raw = window.localStorage.getItem(DICO_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalDicos(list) {
  try {
    window.localStorage.setItem(DICO_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function getSavedDicos() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dico_documents')
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
        writeLocalDicos(list);
        return list;
      }
    } catch (err) {
      console.error('Errore lettura DiCo Supabase:', err);
    }
  }
  return readLocalDicos();
}

export function computeNextDicoNumber(list = []) {
  let max = 0;
  list.forEach((item) => {
    const match = String(item?.dico_number || '').trim().match(/^(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  });
  return String(max + 1);
}

export async function saveDicoToArchive(dico) {
  const now = new Date().toISOString();
  const entry = {
    ...dico,
    id: dico.id || makeId('dico'),
    created_at: dico.created_at || now,
    updated_at: now,
  };

  if (entry.rt) {
    saveRtDefaults(entry.rt);
  }

  const currentLocal = readLocalDicos();
  const idx = currentLocal.findIndex((item) => item.id === entry.id);
  if (idx >= 0) currentLocal[idx] = entry;
  else currentLocal.unshift(entry);
  writeLocalDicos(currentLocal);

  if (supabase) {
    const loc = [entry.location?.address, entry.location?.city].filter(Boolean).join(', ');
    const { error } = await supabase.from('dico_documents').upsert(
      {
        id: entry.id,
        dico_number: String(entry.dico_number || '').trim(),
        dico_date: String(entry.date || ''),
        client_name: String(entry.client?.name || '').trim(),
        location: loc,
        data: entry,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.error('Errore salvataggio DiCo Supabase:', error);
    }
  }

  return await getSavedDicos();
}

export async function deleteDicoFromArchive(dicoId) {
  if (supabase) {
    const { error } = await supabase.from('dico_documents').delete().eq('id', dicoId);
    if (error) {
      console.error('Errore eliminazione DiCo Supabase:', error);
    }
  }
  const nextLocal = readLocalDicos().filter((item) => item.id !== dicoId);
  writeLocalDicos(nextLocal);
  return await getSavedDicos();
}