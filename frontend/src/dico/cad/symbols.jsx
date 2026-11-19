import React from 'react';

export const PIPE_TYPES = {
  frigo_mandata: {
    id: 'frigo_mandata',
    label: 'Rame isolato — Liquido/Gas 1',
    short: 'Rame',
    color: '#b91c1c',
    strokeWidth: 2,
    dash: '',
    defaultMaterial: 'Rame',
    defaultDescription: 'Tubo in Rame isolato UNI EN 12735-1 per condiz.',
    defaultDiameter: '1/4"',
    defaultPosa: 'In Canaletta',
    defaultNorm: 'UNI EN 12735-1',
  },
  frigo_ritorno: {
    id: 'frigo_ritorno',
    label: 'Rame isolato — Aspirazione 2',
    short: 'Rame',
    color: '#3b82f6',
    strokeWidth: 2,
    dash: '',
    defaultMaterial: 'Rame',
    defaultDescription: 'Tubo in Rame isolato UNI EN 12735-1 per condiz.',
    defaultDiameter: '3/8"',
    defaultPosa: 'In Canaletta',
    defaultNorm: 'UNI EN 12735-1',
  },
  condensa: {
    id: 'condensa',
    label: 'Scarico condensa (Gomma/PVC)',
    short: 'Gomma',
    color: '#9333ea',
    strokeWidth: 1.8,
    dash: '',
    defaultMaterial: 'Gomma',
    defaultDescription: 'Tubo in Gomma scarico condensa',
    defaultDiameter: '1/4"',
    defaultPosa: 'In Canaletta',
    defaultNorm: 'UNI EN 378',
  },
  gas: {
    id: 'gas',
    label: 'Gas (metano / GPL)',
    short: 'Gas',
    color: '#eab308',
    strokeWidth: 2.3,
    dash: '',
    defaultMaterial: 'Rame',
    defaultDescription: 'Tubazione Gas UNI 7129',
    defaultDiameter: 'Ø22',
    defaultPosa: 'A vista / in guaina',
    defaultNorm: 'UNI 7129 / EN 1057',
  },
  acqua_fredda: {
    id: 'acqua_fredda',
    label: 'Acqua fredda sanitaria',
    short: 'Multistrato AF',
    color: '#38bdf8',
    strokeWidth: 2.1,
    dash: '',
    defaultMaterial: 'Multistrato',
    defaultDescription: 'Tubazione acqua fredda PEX-Al-PEX',
    defaultDiameter: 'Ø20',
    defaultPosa: 'Sottotraccia isolata',
    defaultNorm: 'UNI 9182 / D.M. 174',
  },
  acqua_calda: {
    id: 'acqua_calda',
    label: 'Acqua calda sanitaria',
    short: 'Multistrato AC',
    color: '#f87171',
    strokeWidth: 2.1,
    dash: '',
    defaultMaterial: 'Multistrato',
    defaultDescription: 'Tubazione acqua calda PEX-Al-PEX',
    defaultDiameter: 'Ø20',
    defaultPosa: 'Sottotraccia isolata',
    defaultNorm: 'UNI 9182 / D.M. 174',
  },
  mandata: {
    id: 'mandata',
    label: 'Mandata riscaldamento',
    short: 'Mandata',
    color: '#fb923c',
    strokeWidth: 2.1,
    dash: '',
    defaultMaterial: 'Multistrato',
    defaultDescription: 'Tubazione mandata riscaldamento',
    defaultDiameter: 'Ø20',
    defaultPosa: 'Sottotraccia isolata',
    defaultNorm: 'UNI 10412',
  },
  ritorno: {
    id: 'ritorno',
    label: 'Ritorno riscaldamento',
    short: 'Ritorno',
    color: '#818cf8',
    strokeWidth: 2.1,
    dash: '6 3',
    defaultMaterial: 'Multistrato',
    defaultDescription: 'Tubazione ritorno riscaldamento',
    defaultDiameter: 'Ø20',
    defaultPosa: 'Sottotraccia isolata',
    defaultNorm: 'UNI 10412',
  },
  scarico: {
    id: 'scarico',
    label: 'Scarico acque reflue',
    short: 'Scarico PP',
    color: '#64748b',
    strokeWidth: 2.6,
    dash: '4 2',
    defaultMaterial: 'PP insonorizzato',
    defaultDescription: 'Tubazione scarico acque reflue',
    defaultDiameter: 'Ø50',
    defaultPosa: 'Sottotraccia',
    defaultNorm: 'UNI EN 12056',
  },
};

export const PIPE_MATERIALS = [
  'Rame',
  'Rame rivestito',
  'Multistrato',
  'Gomma',
  'Acciaio inox',
  'Acciaio zincato',
  'Polietilene PE100',
  'PP-R',
  'PP insonorizzato',
  'PVC',
];

export const PIPE_DIAMETERS = [
  '1/4"',
  '3/8"',
  '1/2"',
  '5/8"',
  '3/4"',
  '1"',
  'Ø14',
  'Ø16',
  'Ø18',
  'Ø20',
  'Ø22',
  'Ø26',
  'Ø32',
  'Ø40',
  'Ø50',
  'Ø110',
];

export const PIPE_POSA_OPTIONS = [
  'In Canaletta',
  'A vista',
  'Sottotraccia',
  'Sottotraccia isolata',
  'In guaina aerata',
  'A pavimento',
  'Interrata',
];

export const CAD_SYMBOL_CATEGORIES = [
  { id: 'clima', label: 'Clima' },
  { id: 'termico', label: 'Termico' },
  { id: 'gas', label: 'Gas' },
  { id: 'idrico', label: 'Idrico' },
  { id: 'arch', label: 'Edile' },
];

export const CAD_SYMBOLS = {
  /* --- CLIMA --- */
  split_pavimento: {
    id: 'split_pavimento',
    category: 'clima',
    label: 'Split a pavimento / parete',
    defaultMaterial: '',
    defaultDimension: '',
    defaultPosa: 'A parete / pavimento',
    defaultNorm: 'Marcatura CE / UNI EN 378',
    ports: [
      { x: -46, y: 2, label: 'Attacco SX' },
      { x: 46, y: 2, label: 'Attacco DX' },
      { x: -24, y: 18, label: 'Scarico condensa' },
      { x: 10, y: 18, label: 'Linea 1' },
      { x: 24, y: 18, label: 'Linea 2' },
    ],
  },
  unita_esterna: {
    id: 'unita_esterna',
    category: 'clima',
    label: 'Unità Esterna',
    defaultMaterial: '',
    defaultDimension: '',
    defaultPosa: 'Su staffe / a pavimento',
    defaultNorm: 'Marcatura CE / F-Gas',
    ports: [
      { x: -24, y: 10, label: 'Attacco SX' },
      { x: 24, y: 10, label: 'Attacco DX' },
      { x: -12, y: 42, label: 'Liquido 1' },
      { x: 0, y: 42, label: 'Condensa' },
      { x: 12, y: 42, label: 'Gas 2' },
    ],
  },
  pompa_condensa: {
    id: 'pompa_condensa',
    category: 'clima',
    label: 'Pompa scarico condensa',
    defaultMaterial: '',
    defaultDimension: '',
    defaultPosa: 'A vista',
    defaultNorm: 'Marcatura CE',
    ports: [
      { x: -14, y: 0, label: 'Ingresso condensa' },
      { x: 14, y: 0, label: 'Uscita condensa' },
      { x: 0, y: -14, label: 'Mandata alto' },
    ],
  },
  cassetta_soffitto: {
    id: 'cassetta_soffitto',
    category: 'clima',
    label: 'Cassetta 4 vie / Canalizzato',
    defaultMaterial: '',
    defaultDimension: '',
    defaultPosa: 'A controsoffitto',
    defaultNorm: 'Marcatura CE',
    ports: [
      { x: -26, y: 0, label: 'Attacco SX' },
      { x: 26, y: 0, label: 'Attacco DX' },
      { x: 0, y: 26, label: 'Scarico condensa' },
    ],
  },

  /* --- TERMICO --- */
  caldaia: {
    id: 'caldaia',
    category: 'termico',
    label: 'Caldaia a condensazione',
    defaultMaterial: 'Generatore murale',
    defaultDimension: '24 kW',
    defaultPosa: 'A parete',
    defaultNorm: 'Marcatura CE / ErP',
    ports: [
      { x: -14, y: 28, label: 'Mandata' },
      { x: -5, y: 28, label: 'Acqua calda' },
      { x: 5, y: 28, label: 'Gas' },
      { x: 14, y: 28, label: 'Ritorno / AF' },
      { x: 0, y: -28, label: 'Scarico fumi' },
    ],
  },
  pompa_calore: {
    id: 'pompa_calore',
    category: 'termico',
    label: 'Pompa di calore aria-acqua',
    defaultMaterial: 'Monoblocco / Split',
    defaultDimension: '8 kW',
    defaultPosa: 'Esterna su basamento',
    defaultNorm: 'Marcatura CE / UNI EN 378',
    ports: [
      { x: -26, y: -8, label: 'Mandata SX' },
      { x: -26, y: 8, label: 'Ritorno SX' },
      { x: 26, y: -8, label: 'Mandata DX' },
      { x: 26, y: 8, label: 'Ritorno DX' },
    ],
  },
  accumulo: {
    id: 'accumulo',
    category: 'termico',
    label: 'Bollitore / Accumulo ACS',
    defaultMaterial: 'Acciaio vetrificato',
    defaultDimension: '150 L',
    defaultPosa: 'A pavimento',
    defaultNorm: 'Marcatura CE',
    ports: [
      { x: -16, y: -12, label: 'Ingresso caldo' },
      { x: -16, y: 12, label: 'Ritorno' },
      { x: 16, y: -12, label: 'Uscita ACS' },
      { x: 16, y: 12, label: 'Ingresso AF' },
    ],
  },
  collettore_termico: {
    id: 'collettore_termico',
    category: 'termico',
    label: 'Collettore riscaldamento',
    defaultMaterial: 'Ottone/Inox in cassetta',
    defaultDimension: '6 vie',
    defaultPosa: 'Incasso a muro',
    defaultNorm: 'UNI 10412',
    ports: [
      { x: -28, y: -5, label: 'Mandata SX' },
      { x: -28, y: 5, label: 'Ritorno SX' },
      { x: 28, y: -5, label: 'Mandata DX' },
      { x: 28, y: 5, label: 'Ritorno DX' },
      { x: -14, y: 14, label: 'Circuito 1' },
      { x: 0, y: 14, label: 'Circuito 2' },
      { x: 14, y: 14, label: 'Circuito 3' },
    ],
  },
  radiatore: {
    id: 'radiatore',
    category: 'termico',
    label: 'Radiatore / Termosifone',
    defaultMaterial: 'Alluminio / Acciaio',
    defaultDimension: 'H 600',
    defaultPosa: 'A parete',
    defaultNorm: 'UNI EN 442',
    ports: [
      { x: -28, y: -7, label: 'Mandata SX' },
      { x: -28, y: 7, label: 'Ritorno SX' },
      { x: 28, y: -7, label: 'Mandata DX' },
      { x: 28, y: 7, label: 'Ritorno DX' },
    ],
  },
  termoarredo: {
    id: 'termoarredo',
    category: 'termico',
    label: 'Scaldasalviette',
    defaultMaterial: 'Acciaio verniciato',
    defaultDimension: '500x1200',
    defaultPosa: 'A parete',
    defaultNorm: 'UNI EN 442',
    ports: [
      { x: -10, y: 24, label: 'Mandata' },
      { x: 10, y: 24, label: 'Ritorno' },
    ],
  },
  scarico_fumi: {
    id: 'scarico_fumi',
    category: 'termico',
    label: 'Scarico fumi / Canna fumaria',
    defaultMaterial: 'PP / Inox',
    defaultDimension: 'Ø60/100',
    defaultPosa: 'A parete / tetto',
    defaultNorm: 'UNI 7129-3 / EN 14471',
    ports: [
      { x: 0, y: 14, label: 'Attacco fumi' },
      { x: 0, y: -14, label: 'Uscita fumi' },
    ],
  },
  termostato: {
    id: 'termostato',
    category: 'termico',
    label: 'Cronotermostato ambiente',
    defaultMaterial: 'Digitale',
    defaultDimension: '',
    defaultPosa: 'A parete',
    defaultNorm: 'Marcatura CE',
    ports: [],
  },

  /* --- GAS --- */
  contatore_gas: {
    id: 'contatore_gas',
    category: 'gas',
    label: 'Contatore Gas',
    defaultMaterial: 'Acciaio/Ottone',
    defaultDimension: 'G4',
    defaultPosa: 'In nicchia esterna',
    defaultNorm: 'UNI 7129',
    ports: [
      { x: -10, y: -14, label: 'Ingresso rete' },
      { x: 10, y: -14, label: 'Uscita gas' },
    ],
  },
  valvola_gas: {
    id: 'valvola_gas',
    category: 'gas',
    label: 'Valvola intercettazione Gas',
    defaultMaterial: 'Ottone a sfera',
    defaultDimension: '3/4"',
    defaultPosa: 'A vista / accessibile',
    defaultNorm: 'UNI EN 331',
    ports: [
      { x: -15, y: 0, label: 'Ingresso' },
      { x: 15, y: 0, label: 'Uscita' },
    ],
  },
  giunto_dielettrico: {
    id: 'giunto_dielettrico',
    category: 'gas',
    label: 'Giunto dielettrico',
    defaultMaterial: 'Acciaio isolato',
    defaultDimension: '3/4"',
    defaultPosa: 'In linea',
    defaultNorm: 'UNI 10284',
    ports: [
      { x: -16, y: 0, label: 'Lato 1' },
      { x: 16, y: 0, label: 'Lato 2' },
    ],
  },
  piano_cottura: {
    id: 'piano_cottura',
    category: 'gas',
    label: 'Piano cottura gas',
    defaultMaterial: 'Apparecchio tipo A',
    defaultDimension: '4 fuochi',
    defaultPosa: 'Incasso top',
    defaultNorm: 'UNI 7129 / CE',
    ports: [{ x: 0, y: 16, label: 'Attacco gas' }],
  },
  foro_ventilazione: {
    id: 'foro_ventilazione',
    category: 'gas',
    label: 'Foro ventilazione / aerazione',
    defaultMaterial: 'Griglia anti-insetto',
    defaultDimension: '100 cm²',
    defaultPosa: 'Su parete esterna',
    defaultNorm: 'UNI 7129-2',
    ports: [],
  },

  /* --- IDRICO --- */
  contatore_acqua: {
    id: 'contatore_acqua',
    category: 'idrico',
    label: 'Contatore Acqua',
    defaultMaterial: 'Ottone',
    defaultDimension: '1/2"',
    defaultPosa: 'In cassetta',
    defaultNorm: 'MID / UNI 9182',
    ports: [
      { x: -18, y: 0, label: 'Ingresso' },
      { x: 18, y: 0, label: 'Uscita' },
    ],
  },
  valvola_acqua: {
    id: 'valvola_acqua',
    category: 'idrico',
    label: 'Valvola intercettazione acqua',
    defaultMaterial: 'Ottone cromato',
    defaultDimension: '3/4"',
    defaultPosa: 'Incasso / a vista',
    defaultNorm: 'UNI EN 13828',
    ports: [
      { x: -15, y: 0, label: 'Ingresso' },
      { x: 15, y: 0, label: 'Uscita' },
    ],
  },
  collettore_sanitario: {
    id: 'collettore_sanitario',
    category: 'idrico',
    label: 'Collettore idrico-sanitario',
    defaultMaterial: 'Ottone con valvole',
    defaultDimension: '4+3 vie',
    defaultPosa: 'In cassetta incasso',
    defaultNorm: 'UNI 9182 / D.M. 174',
    ports: [
      { x: -28, y: -5, label: 'AC SX' },
      { x: -28, y: 5, label: 'AF SX' },
      { x: 28, y: -5, label: 'AC DX' },
      { x: 28, y: 5, label: 'AF DX' },
      { x: -14, y: 14, label: 'Uscita 1' },
      { x: 0, y: 14, label: 'Uscita 2' },
      { x: 14, y: 14, label: 'Uscita 3' },
    ],
  },
  wc: {
    id: 'wc',
    category: 'idrico',
    label: 'Vaso WC + cassetta',
    defaultMaterial: 'Ceramica sanitaria',
    defaultDimension: 'Ø110',
    defaultPosa: 'A pavimento / sospeso',
    defaultNorm: 'UNI EN 997',
    ports: [
      { x: -8, y: -18, label: 'Carico AF' },
      { x: 0, y: 18, label: 'Scarico Ø110' },
    ],
  },

  bidet: {
    id: 'bidet',
    category: 'idrico',
    label: 'Bidet',
    defaultMaterial: 'Ceramica sanitaria',
    defaultDimension: 'Ø40',
    defaultPosa: 'A pavimento / sospeso',
    defaultNorm: 'UNI 9182',
    ports: [
      { x: -9, y: -16, label: 'Acqua calda' },
      { x: 9, y: -16, label: 'Acqua fredda' },
      { x: 0, y: 16, label: 'Scarico Ø40' },
    ],
  },

  lavabo: {
    id: 'lavabo',
    category: 'idrico',
    label: 'Lavabo / Lavello',
    defaultMaterial: 'Ceramica / Inox',
    defaultDimension: 'Ø40',
    defaultPosa: 'A parete / mobile',
    defaultNorm: 'UNI 9182',
    ports: [
      { x: -9, y: 13, label: 'Acqua calda' },
      { x: 0, y: 13, label: 'Scarico Ø40' },
      { x: 9, y: 13, label: 'Acqua fredda' },
    ],
  },
  doccia: {
    id: 'doccia',
    category: 'idrico',
    label: 'Doccia / Vasca',
    defaultMaterial: 'Miscelatore + piletta',
    defaultDimension: 'Ø50',
    defaultPosa: 'A filo pavimento',
    defaultNorm: 'UNI 9182',
    ports: [
      { x: -10, y: -20, label: 'Acqua calda' },
      { x: 10, y: -20, label: 'Acqua fredda' },
      { x: 0, y: 0, label: 'Scarico piletta' },
      { x: -20, y: 0, label: 'Scarico SX' },
    ],
  },
  lavatrice: {
    id: 'lavatrice',
    category: 'idrico',
    label: 'Attacco Lavatrice / Lavast.',
    defaultMaterial: 'Rubinetto + sifone',
    defaultDimension: '1/2" / Ø40',
    defaultPosa: 'Incasso a muro',
    defaultNorm: 'UNI 9182',
    ports: [
      { x: -8, y: 16, label: 'Carico AF' },
      { x: 8, y: 16, label: 'Scarico Ø40' },
    ],
  },

  /* --- EDILE / ARCHITETTONICO --- */
  finestra_prospetto: {
    id: 'finestra_prospetto',
    category: 'arch',
    label: 'Finestra (prospetto)',
    isArchitectural: true,
    ports: [],
  },
  porta_pianta: {
    id: 'porta_pianta',
    category: 'arch',
    label: 'Porta (pianta)',
    isArchitectural: true,
    ports: [],
  },
  staffa_tetto: {
    id: 'staffa_tetto',
    category: 'arch',
    label: 'Staffa / Mensola UE',
    isArchitectural: true,
    ports: [],
  },
};

/** Calcola le coordinate reali (sul foglio SVG) di tutte le porte di attacco di un simbolo. */
export function getSymbolWorldPorts(el) {
  const def = CAD_SYMBOLS[el?.symbolType];
  if (!def || !Array.isArray(def.ports) || !def.ports.length) return [];
  const sc = el.scale || 1;
  const rad = ((el.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return def.ports.map((p, idx) => {
    const sx = p.x * sc;
    const sy = p.y * sc;
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    return {
      id: `${el.id}-port-${idx}`,
      symbolId: el.id,
      symbolCode: el.code || def.label,
      label: p.label || 'Attacco',
      x: Math.round(el.x + rx),
      y: Math.round(el.y + ry),
    };
  });
}

/**
 * Disegno vettoriale tecnico stile CAD blueprint (corpo bianco opaco così i tubi
 * passano visivamente dietro al simbolo).
 */
export function renderSymbolGlyph(symbolType, { showPorts = false } = {}) {
  const def = CAD_SYMBOLS[symbolType];
  const blue = '#1e40af';
  const slate = '#334155';
  const portColor = '#dc2626';

  let glyph = null;

  switch (symbolType) {
    case 'split_pavimento':
      glyph = (
        <g>
          {[-30, -10, 10, 30].map((ax) => (
            <g key={ax} stroke={blue} strokeWidth="1" fill="none">
              <line x1={ax} y1="-22" x2={ax} y2="-36" />
              <polyline points={`${ax - 3.5},-31 ${ax},-36 ${ax + 3.5},-31`} />
            </g>
          ))}
          <rect x="-46" y="-18" width="92" height="36" rx="5" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="-40" y1="-12" x2="40" y2="-12" stroke={blue} strokeWidth="0.8" />
          <line x1="-40" y1="12" x2="40" y2="12" stroke={blue} strokeWidth="0.8" strokeDasharray="3 2" />
        </g>
      );
      break;

    case 'unita_esterna':
      glyph = (
        <g>
          <rect x="-24" y="-42" width="48" height="84" rx="1.5" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="-24" y1="10" x2="24" y2="10" stroke={blue} strokeWidth="0.9" />
          <ellipse cx="-9" cy="-16" rx="9" ry="4" fill="none" stroke={blue} strokeWidth="1.1" />
          <ellipse cx="9" cy="-16" rx="9" ry="4" fill="none" stroke={blue} strokeWidth="1.1" />
          <circle cx="0" cy="-16" r="2" fill={blue} />
          <path d="M-12,26 Q-6,35 0,26 Q6,35 12,26" fill="none" stroke={blue} strokeWidth="1.1" />
          <line x1="-18" y1="36" x2="18" y2="36" stroke={blue} strokeWidth="0.9" />
        </g>
      );
      break;

    case 'pompa_condensa':
      glyph = (
        <g>
          <circle cx="0" cy="0" r="14" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <polygon points="-5,-6 8,0 -5,6" fill="none" stroke={blue} strokeWidth="1.2" />
        </g>
      );
      break;

    case 'cassetta_soffitto':
      glyph = (
        <g>
          <rect x="-26" y="-26" width="52" height="52" rx="2" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <rect x="-15" y="-15" width="30" height="30" fill="none" stroke={blue} strokeWidth="0.9" />
          <line x1="-22" y1="-22" x2="-15" y2="-15" stroke={blue} strokeWidth="0.9" />
          <line x1="22" y1="-22" x2="15" y2="-15" stroke={blue} strokeWidth="0.9" />
          <line x1="-22" y1="22" x2="-15" y2="15" stroke={blue} strokeWidth="0.9" />
          <line x1="22" y1="22" x2="15" y2="15" stroke={blue} strokeWidth="0.9" />
        </g>
      );
      break;

    case 'caldaia':
      glyph = (
        <g>
          <rect x="-20" y="-28" width="40" height="56" rx="2" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="-20" y1="14" x2="20" y2="14" stroke={blue} strokeWidth="0.9" />
          <path d="M0,-14 C6,-5 8,2 0,9 C-8,2 -6,-5 0,-14 Z" fill="none" stroke="#dc2626" strokeWidth="1.2" />
          <rect x="-12" y="18" width="24" height="6" fill="none" stroke={blue} strokeWidth="0.8" />
        </g>
      );
      break;

    case 'pompa_calore':
      glyph = (
        <g>
          <rect x="-26" y="-22" width="52" height="44" rx="2" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <circle cx="-7" cy="0" r="13" fill="none" stroke={blue} strokeWidth="1.1" />
          <line x1="-16" y1="-9" x2="2" y2="9" stroke={blue} strokeWidth="1" />
          <line x1="-16" y1="9" x2="2" y2="-9" stroke={blue} strokeWidth="1" />
          <text x="15" y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill={blue}>PdC</text>
        </g>
      );
      break;

    case 'accumulo':
      glyph = (
        <g>
          <rect x="-16" y="-28" width="32" height="56" rx="14" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <path d="M-9,-10 Q0,-16 9,-10 Q0,-4 -9,2 Q0,8 9,14" fill="none" stroke="#dc2626" strokeWidth="1.2" />
        </g>
      );
      break;

    case 'collettore_termico':
    case 'collettore_sanitario':
      glyph = (
        <g>
          <rect x="-28" y="-14" width="56" height="28" rx="1.5" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="-22" y1="-5" x2="22" y2="-5" stroke="#dc2626" strokeWidth="2.2" />
          <line x1="-22" y1="5" x2="22" y2="5" stroke="#2563eb" strokeWidth="2.2" />
          {[-14, 0, 14].map((vx) => (
            <line key={vx} x1={vx} y1="-5" x2={vx} y2="14" stroke={slate} strokeWidth="1" />
          ))}
        </g>
      );
      break;

    case 'radiatore':
      glyph = (
        <g>
          <rect x="-28" y="-11" width="56" height="22" rx="1.5" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          {[-20, -12, -4, 4, 12, 20].map((rx) => (
            <line key={rx} x1={rx} y1="-11" x2={rx} y2="11" stroke={blue} strokeWidth="1" />
          ))}
        </g>
      );
      break;

    case 'termoarredo':
      glyph = (
        <g>
          <rect x="-14" y="-24" width="28" height="48" rx="1.5" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          {[-16, -8, 0, 8, 16].map((ry) => (
            <line key={ry} x1="-14" y1={ry} x2="14" y2={ry} stroke={blue} strokeWidth="1" />
          ))}
        </g>
      );
      break;

    case 'scarico_fumi':
      glyph = (
        <g>
          <circle cx="0" cy="0" r="14" fill="#ffffff" stroke={slate} strokeWidth="1.3" />
          <circle cx="0" cy="0" r="8" fill="none" stroke={slate} strokeWidth="1" strokeDasharray="3 2" />
          <line x1="-9" y1="-9" x2="9" y2="9" stroke={slate} strokeWidth="1" />
        </g>
      );
      break;

    case 'termostato':
      glyph = (
        <g>
          <rect x="-13" y="-13" width="26" height="26" rx="2" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill={blue}>TA</text>
        </g>
      );
      break;

    case 'contatore_gas':
    case 'contatore_acqua':
      glyph = (
        <g>
          <rect x="-18" y="-14" width="36" height="28" rx="2" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <circle cx="0" cy="0" r="8" fill="none" stroke={blue} strokeWidth="1" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="700" fill={blue}>
            {symbolType === 'contatore_gas' ? 'G4' : 'H2O'}
          </text>
        </g>
      );
      break;

    case 'valvola_gas':
    case 'valvola_acqua':
      glyph = (
        <g>
          <rect x="-15" y="-9" width="30" height="18" fill="#ffffff" stroke="none" />
          <polygon points="-15,-8 0,0 -15,8" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <polygon points="15,-8 0,0 15,8" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="0" y1="0" x2="0" y2="-13" stroke={blue} strokeWidth="1.3" />
          <line x1="-7" y1="-13" x2="7" y2="-13" stroke={blue} strokeWidth="2" />
        </g>
      );
      break;

    case 'giunto_dielettrico':
      glyph = (
        <g>
          <rect x="-16" y="-9" width="32" height="18" fill="#ffffff" stroke="none" />
          <line x1="-16" y1="0" x2="-5" y2="0" stroke={blue} strokeWidth="1.8" />
          <line x1="5" y1="0" x2="16" y2="0" stroke={blue} strokeWidth="1.8" />
          <rect x="-5" y="-9" width="10" height="18" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="0" y1="-9" x2="0" y2="9" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="2 2" />
        </g>
      );
      break;

    case 'piano_cottura':
      glyph = (
        <g>
          <rect x="-24" y="-16" width="48" height="32" rx="2" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <circle cx="-11" cy="-6" r="5" fill="none" stroke={blue} strokeWidth="1.1" />
          <circle cx="11" cy="-6" r="4" fill="none" stroke={blue} strokeWidth="1.1" />
          <circle cx="-11" cy="7" r="4" fill="none" stroke={blue} strokeWidth="1.1" />
          <circle cx="11" cy="7" r="5.5" fill="none" stroke={blue} strokeWidth="1.1" />
        </g>
      );
      break;

    case 'foro_ventilazione':
      glyph = (
        <g>
          <circle cx="0" cy="0" r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.3" />
          <line x1="-9" y1="-5" x2="9" y2="-5" stroke="#0f766e" strokeWidth="1.1" />
          <line x1="-11" y1="0" x2="11" y2="0" stroke="#0f766e" strokeWidth="1.1" />
          <line x1="-9" y1="5" x2="9" y2="5" stroke="#0f766e" strokeWidth="1.1" />
        </g>
      );
      break;

    case 'wc':
      glyph = (
        <g>
          <rect x="-13" y="-18" width="26" height="9" rx="1" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <ellipse cx="0" cy="5" rx="11" ry="13" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
        </g>
      );
      break;

    case 'bidet':
      glyph = (
        <g>
          {/* Corpo sanitario arrotondato */}
          <path
            d="M-12,-16 L12,-16 L12,2 A12,14 0 0,1 -12,2 Z"
            fill="#ffffff"
            stroke={blue}
            strokeWidth="1.3"
          />
          {/* Vasca interna */}
          <ellipse cx="0" cy="2" rx="8" ry="10" fill="none" stroke={blue} strokeWidth="0.9" />
          {/* Miscelatore posteriore */}
          <circle cx="0" cy="-11" r="2" fill={blue} />
          <line x1="0" y1="-11" x2="0" y2="-6" stroke={blue} strokeWidth="1.3" />
          {/* Piletta scarico */}
          <circle cx="0" cy="4" r="2.2" fill="none" stroke={blue} strokeWidth="1" />
        </g>
      );
      break;

    case 'lavabo':
      glyph = (
        <g>
          <rect x="-18" y="-13" width="36" height="26" rx="5" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <circle cx="0" cy="2" r="3" fill="none" stroke={blue} strokeWidth="1.1" />
        </g>
      );
      break;

    case 'doccia':
      glyph = (
        <g>
          <rect x="-20" y="-20" width="40" height="40" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <line x1="-20" y1="-20" x2="20" y2="20" stroke={blue} strokeWidth="0.7" opacity="0.6" />
          <line x1="20" y1="-20" x2="-20" y2="20" stroke={blue} strokeWidth="0.7" opacity="0.6" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" stroke={blue} strokeWidth="1.1" />
        </g>
      );
      break;

    case 'lavatrice':
      glyph = (
        <g>
          <rect x="-16" y="-16" width="32" height="32" fill="#ffffff" stroke={blue} strokeWidth="1.3" />
          <circle cx="0" cy="2" r="9" fill="none" stroke={blue} strokeWidth="1.1" />
          <line x1="-16" y1="-9" x2="16" y2="-9" stroke={blue} strokeWidth="0.9" />
        </g>
      );
      break;

    case 'finestra_prospetto':
      glyph = (
        <g stroke={slate} strokeWidth="1.1" fill="#ffffff">
          <rect x="-36" y="-62" width="72" height="14" />
          <rect x="-36" y="-42" width="72" height="88" />
          <rect x="-30" y="-36" width="28" height="76" />
          <rect x="2" y="-36" width="28" height="76" />
          <rect x="-42" y="46" width="84" height="8" />
        </g>
      );
      break;

    case 'porta_pianta':
      glyph = (
        <g stroke={slate} strokeWidth="1.2" fill="none">
          <line x1="-20" y1="20" x2="-20" y2="-20" strokeWidth="2" />
          <path d="M-20,-20 A40,40 0 0,1 20,20" strokeDasharray="3 2" />
          <line x1="-22" y1="20" x2="-18" y2="20" />
          <line x1="18" y1="20" x2="22" y2="20" />
        </g>
      );
      break;

    case 'staffa_tetto':
      glyph = (
        <g stroke="#15803d" strokeWidth="1.8" fill="none">
          <line x1="-30" y1="0" x2="30" y2="0" />
          <line x1="-26" y1="0" x2="22" y2="22" />
          <line x1="22" y1="0" x2="22" y2="22" />
        </g>
      );
      break;

    default:
      glyph = <circle cx="0" cy="0" r="10" fill="#ffffff" stroke={blue} strokeWidth="1.2" />;
  }

  return (
    <g>
      {glyph}
      {showPorts && Array.isArray(def?.ports)
        ? def.ports.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="2.6"
              fill="#ffffff"
              stroke={portColor}
              strokeWidth="1"
            />
          ))
        : null}
    </g>
  );
}