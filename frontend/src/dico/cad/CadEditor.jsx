import React, { useMemo, useRef, useState, useEffect } from 'react';
import { makeId } from '../../quote/quoteModel';
import { computePipeMeters } from '../dicoModel';
import {
  CAD_SYMBOLS,
  CAD_SYMBOL_CATEGORIES,
  PIPE_TYPES,
  PIPE_MATERIALS,
  PIPE_DIAMETERS,
  PIPE_POSA_OPTIONS,
  renderSymbolGlyph,
} from './symbols';

const DEFAULT_W = 1000;
const DEFAULT_H = 640;
const DEFAULT_GRID = 20;

function getPipePoints(pipe) {
  if (Array.isArray(pipe.points) && pipe.points.length >= 2) {
    return pipe.points;
  }
  return [
    { x: pipe.x1 ?? 0, y: pipe.y1 ?? 0 },
    { x: pipe.x2 ?? 0, y: pipe.y2 ?? 0 },
  ];
}

/** Trova il segmento più lungo di una polilinea per posizionare etichetta e quota. */
function getLongestSegment(pts) {
  let best = { p1: pts[0], p2: pts[1], len: 0 };
  for (let i = 1; i < pts.length; i += 1) {
    const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (len >= best.len) {
      best = { p1: pts[i - 1], p2: pts[i], len };
    }
  }
  const mx = (best.p1.x + best.p2.x) / 2;
  const my = (best.p1.y + best.p2.y) / 2;
  let angle = (Math.atan2(best.p2.y - best.p1.y, best.p2.x - best.p1.x) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  return { mx, my, angle, len: best.len };
}

/** Calcola il poligono rettangolare per un muro/solaio tratteggiato da (x1,y1) a (x2,y2). */
function hatchWallPolygon(x1, y1, x2, y2, thickness = 22) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (thickness / 2);
  const ny = (dx / len) * (thickness / 2);
  return `${x1 + nx},${y1 + ny} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny} ${x1 - nx},${y1 - ny}`;
}

/**
 * Renderer SVG tecnico stile CAD/mrDico.
 * Usato sia nell'editor interattivo sia nella Tavola A4 di stampa.
 */
export function CadSvgRenderer({
  drawing,
  showGrid = true,
  showPorts = true,
  selectedId = null,
  draftPoints = null,
  draftTool = null,
  draftColor = '#1e293b',
  interactive = false,
  onSelectElement,
  onStartDragSymbol,
  onStartDragNode,
}) {
  const width = drawing?.width || DEFAULT_W;
  const height = drawing?.height || DEFAULT_H;
  const gridSize = drawing?.gridSize || DEFAULT_GRID;
  const elements = Array.isArray(drawing?.elements) ? drawing.elements : [];

  const sorted = useMemo(() => {
    const order = { room: 1, hatchWall: 2, wall: 2, pipe: 3, symbol: 4, text: 5 };
    return [...elements].sort((a, b) => (order[a.kind] || 9) - (order[b.kind] || 9));
  }, [elements]);

  return (
    <>
      <defs>
        <pattern id="cad-grid-minor" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#eef2f6" strokeWidth="0.7" />
        </pattern>
        <pattern id="cad-grid-major" width={gridSize * 5} height={gridSize * 5} patternUnits="userSpaceOnUse">
          <rect width={gridSize * 5} height={gridSize * 5} fill="url(#cad-grid-minor)" />
          <path d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`} fill="none" stroke="#dbe3ec" strokeWidth="0.9" />
        </pattern>
        {/* Tratteggio obliquo 45° stile disegno architettonico CAD (muri, solai, tetti) */}
        <pattern id="cad-hatch-45" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1.2" />
        </pattern>
      </defs>

      {/* Foglio bianco */}
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

      {/* Piantina di sfondo */}
      {drawing?.backgroundImage ? (
        <image
          href={drawing.backgroundImage}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
          opacity={drawing.backgroundOpacity ?? 0.35}
          style={{ pointerEvents: 'none' }}
        />
      ) : null}

      {/* Griglia */}
      {showGrid ? (
        <rect x="0" y="0" width={width} height={height} fill="url(#cad-grid-major)" style={{ pointerEvents: 'none' }} />
      ) : null}

      {/* Elementi */}
      {sorted.map((el) => {
        const isSel = interactive && el.id === selectedId;

        if (el.kind === 'room') {
          const x = Math.min(el.x1, el.x2);
          const y = Math.min(el.y1, el.y2);
          const w = Math.abs(el.x2 - el.x1);
          const h = Math.abs(el.y2 - el.y1);
          return (
            <g
              key={el.id}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              onPointerDown={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onSelectElement?.(el.id);
              }}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="#ffffff"
                fillOpacity="0.4"
                stroke={isSel ? '#14532d' : '#1e293b'}
                strokeWidth={isSel ? 7 : 6}
              />
              {el.label ? (
                <text
                  x={x + w / 2}
                  y={y + 22}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="700"
                  letterSpacing="0.06em"
                  fill="#64748b"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {el.label.toUpperCase()}
                </text>
              ) : null}
            </g>
          );
        }

        if (el.kind === 'hatchWall') {
          const poly = hatchWallPolygon(el.x1, el.y1, el.x2, el.y2, el.thickness || 22);
          return (
            <g key={el.id}>
              <polygon
                points={poly}
                fill="url(#cad-hatch-45)"
                stroke={isSel ? '#14532d' : '#1e293b'}
                strokeWidth={isSel ? 2 : 1.1}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onPointerDown={(e) => {
                  if (!interactive) return;
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }}
              />
              {isSel ? (
                <>
                  <circle
                    cx={el.x1}
                    cy={el.y1}
                    r="6"
                    fill="#ffffff"
                    stroke="#14532d"
                    strokeWidth="2.2"
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDragNode?.(e, el.id, 'p1');
                    }}
                  />
                  <circle
                    cx={el.x2}
                    cy={el.y2}
                    r="6"
                    fill="#ffffff"
                    stroke="#14532d"
                    strokeWidth="2.2"
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDragNode?.(e, el.id, 'p2');
                    }}
                  />
                </>
              ) : null}
            </g>
          );
        }

        if (el.kind === 'wall') {
          return (
            <g key={el.id}>
              {interactive ? (
                <line
                  x1={el.x1}
                  y1={el.y1}
                  x2={el.x2}
                  y2={el.y2}
                  stroke="transparent"
                  strokeWidth="16"
                  style={{ cursor: 'pointer' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectElement?.(el.id);
                  }}
                />
              ) : null}
              <line
                x1={el.x1}
                y1={el.y1}
                x2={el.x2}
                y2={el.y2}
                stroke={isSel ? '#14532d' : '#1e293b'}
                strokeWidth="5"
                strokeLinecap="square"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        }

        if (el.kind === 'pipe') {
          const preset = PIPE_TYPES[el.pipeType] || PIPE_TYPES.acqua_fredda;
          const pts = getPipePoints(el);
          const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
          const seg = getLongestSegment(pts);
          const len =
            Number(el.lengthMeters) ||
            computePipeMeters(el, drawing?.gridSize, drawing?.metersPerCell);
          const specText = `${len.toFixed(2).replace('.', ',')} m${el.diameter ? ` - ${el.diameter}` : ''}`;
          const matText = el.material || preset.short;

          return (
            <g key={el.id}>
              {interactive ? (
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  style={{ cursor: 'pointer' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectElement?.(el.id);
                  }}
                />
              ) : null}
              {isSel ? (
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke="#bbf7d0"
                  strokeWidth={preset.strokeWidth + 6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              ) : null}
              <polyline
                points={pointsStr}
                fill="none"
                stroke={preset.color}
                strokeWidth={preset.strokeWidth}
                strokeDasharray={preset.dash || undefined}
                strokeLinejoin="miter"
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />

              {/* Sigla P... in rosso stile mrDico vicino al primo tratto */}
              {el.code ? (
                <text
                  x={(pts[0].x + pts[1].x) / 2 + 8}
                  y={(pts[0].y + pts[1].y) / 2 - 6}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#991b1b"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {el.code}
                </text>
              ) : null}

              {/* Quota tecnica allineata e ruotata lungo il tratto più lungo */}
              {seg.len >= 45 ? (
                <g
                  transform={`translate(${seg.mx}, ${seg.my}) rotate(${seg.angle})`}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  <text
                    x="0"
                    y="-5"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#1e3a8a"
                  >
                    {matText}
                  </text>
                  <text
                    x="0"
                    y="12"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#1e3a8a"
                  >
                    {specText}
                  </text>
                </g>
              ) : null}

              {/* Maniglie vertici modificabili */}
              {isSel
                ? pts.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r="5.5"
                      fill="#ffffff"
                      stroke="#14532d"
                      strokeWidth="2.2"
                      style={{ cursor: 'grab' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onStartDragNode?.(e, el.id, idx);
                      }}
                    />
                  ))
                : null}
            </g>
          );
        }

        if (el.kind === 'symbol') {
          const def = CAD_SYMBOLS[el.symbolType];
          const sc = el.scale || 1;
          return (
            <g
              key={el.id}
              transform={`translate(${el.x}, ${el.y})`}
              style={{ cursor: interactive ? 'grab' : 'default' }}
              onPointerDown={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onStartDragSymbol?.(e, el.id);
              }}
            >
              {isSel ? (
                <rect
                  x={-36 * sc}
                  y={-36 * sc}
                  width={72 * sc}
                  height={72 * sc}
                  rx="6"
                  fill="#f0fdf4"
                  fillOpacity="0.55"
                  stroke="#14532d"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              ) : null}
              <g transform={`rotate(${el.rotation || 0}) scale(${sc})`}>
                {renderSymbolGlyph(el.symbolType, { showPorts: showPorts && !def?.isArchitectural })}
              </g>
              {el.code && !def?.isArchitectural ? (
                <text
                  x={-34 * sc}
                  y={4}
                  textAnchor="end"
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#991b1b"
                  style={{ userSelect: 'none' }}
                >
                  {el.code}
                </text>
              ) : null}
            </g>
          );
        }

        if (el.kind === 'text') {
          return (
            <g
              key={el.id}
              transform={`translate(${el.x}, ${el.y})`}
              style={{ cursor: interactive ? 'grab' : 'default' }}
              onPointerDown={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onStartDragSymbol?.(e, el.id);
              }}
            >
              {isSel ? (
                <rect
                  x="-48"
                  y="-14"
                  width="96"
                  height="22"
                  rx="4"
                  fill="#f0fdf4"
                  stroke="#14532d"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
              ) : null}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize={el.fontSize || 12.5}
                fontWeight="700"
                fill="#0f172a"
                style={{ userSelect: 'none' }}
              >
                {el.text || 'Etichetta'}
              </text>
            </g>
          );
        }

        return null;
      })}

      {/* Anteprima live polilinea / muro / stanza */}
      {Array.isArray(draftPoints) && draftPoints.length >= 2 ? (
        <g style={{ pointerEvents: 'none' }}>
          {draftTool === 'room' ? (
            <rect
              x={Math.min(draftPoints[0].x, draftPoints[1].x)}
              y={Math.min(draftPoints[0].y, draftPoints[1].y)}
              width={Math.abs(draftPoints[1].x - draftPoints[0].x)}
              height={Math.abs(draftPoints[1].y - draftPoints[0].y)}
              fill="#f0fdf4"
              fillOpacity="0.4"
              stroke="#14532d"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          ) : draftTool === 'hatchWall' ? (
            <polygon
              points={hatchWallPolygon(draftPoints[0].x, draftPoints[0].y, draftPoints[1].x, draftPoints[1].y, 22)}
              fill="url(#cad-hatch-45)"
              fillOpacity="0.6"
              stroke="#14532d"
              strokeWidth="1.8"
              strokeDasharray="5 3"
            />
          ) : (
            <polyline
              points={draftPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={draftColor}
              strokeWidth="2.6"
              strokeDasharray="6 3"
            />
          )}
          {draftPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#14532d" />
          ))}
        </g>
      ) : null}
    </>
  );
}

/**
 * Editor CAD 2D completo con polilinee, muri tratteggiati 45°, simboli blueprint,
 * ubicazione, scala elemento, piantina di sfondo, undo e sincronizzazione materiali.
 */
export function CadEditor({ drawing, onChangeDrawing, onSyncMaterials }) {
  const svgRef = useRef(null);
  const bgInputRef = useRef(null);

  const [tool, setTool] = useState('select'); // 'select' | 'pipe' | 'hatchWall' | 'room' | 'symbol' | 'text'
  const [activePipeType, setActivePipeType] = useState('frigo_mandata');
  const [activeSymbolCategory, setActiveSymbolCategory] = useState('clima');
  const [activeSymbolType, setActiveSymbolType] = useState('split_pavimento');

  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [orthoMode, setOrthoMode] = useState(true);

  const [polyPoints, setPolyPoints] = useState([]);
  const [cursorPt, setCursorPt] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [history, setHistory] = useState([]);

  const safeDrawing = drawing || {
    width: DEFAULT_W,
    height: DEFAULT_H,
    gridSize: DEFAULT_GRID,
    metersPerCell: 0.25,
    backgroundImage: '',
    backgroundOpacity: 0.35,
    elements: [],
  };

  const elements = safeDrawing.elements || [];
  const selectedEl = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId],
  );

  const commitDrawing = (nextDrawing, recordUndo = true) => {
    if (recordUndo) {
      setHistory((prev) => [...prev.slice(-24), safeDrawing]);
    }
    onChangeDrawing(nextDrawing);
  };

  const getNextPCode = () => {
    let maxN = 0;
    elements.forEach((el) => {
      const m = String(el.code || '').match(/^P(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxN) maxN = n;
      }
    });
    return `P${maxN + 1}`;
  };

  const finishPolylinePipe = (ptsToSave = polyPoints) => {
    if (ptsToSave.length < 2) {
      setPolyPoints([]);
      return;
    }
    const preset = PIPE_TYPES[activePipeType] || PIPE_TYPES.acqua_fredda;
    const lengthMeters = computePipeMeters(
      { points: ptsToSave },
      safeDrawing.gridSize,
      safeDrawing.metersPerCell,
    );
    const newPipe = {
      id: makeId('pipe'),
      kind: 'pipe',
      pipeType: preset.id,
      code: getNextPCode(),
      location: '',
      label: preset.defaultDescription || preset.label,
      material: preset.defaultMaterial,
      diameter: preset.defaultDiameter,
      posa: preset.defaultPosa,
      lengthMeters,
      points: ptsToSave,
    };
    commitDrawing({ ...safeDrawing, elements: [...elements, newPipe] });
    setSelectedId(newPipe.id);
    setPolyPoints([]);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        if (tool === 'pipe' && polyPoints.length >= 2) {
          finishPolylinePipe(polyPoints);
        } else {
          setPolyPoints([]);
          setSelectedId(null);
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, tool, polyPoints, safeDrawing]);

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onChangeDrawing(prev);
    setPolyPoints([]);
  };

  const clientToSvgPoint = (clientX, clientY, anchor = null) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * safeDrawing.width;
    let y = ((clientY - rect.top) / rect.height) * safeDrawing.height;

    const g = safeDrawing.gridSize || DEFAULT_GRID;
    if (snapToGrid) {
      x = Math.round(x / (g / 2)) * (g / 2);
      y = Math.round(y / (g / 2)) * (g / 2);
    }

    if (anchor && orthoMode && (tool === 'pipe' || tool === 'hatchWall')) {
      const dx = Math.abs(x - anchor.x);
      const dy = Math.abs(y - anchor.y);
      // Consente 0°, 90° e diagonale 45° (comodissima per falde tetto e raccordi)
      if (dx > dy * 2.2) {
        y = anchor.y;
      } else if (dy > dx * 2.2) {
        x = anchor.x;
      }
    }

    x = Math.max(10, Math.min(safeDrawing.width - 10, Math.round(x)));
    y = Math.max(10, Math.min(safeDrawing.height - 10, Math.round(y)));
    return { x, y };
  };

  const handleSvgPointerDown = (e) => {
    if (e.button === 2) {
      if (tool === 'pipe' && polyPoints.length >= 2) finishPolylinePipe();
      else setPolyPoints([]);
      return;
    }

    const anchor = polyPoints.length > 0 ? polyPoints[polyPoints.length - 1] : null;
    const pt = clientToSvgPoint(e.clientX, e.clientY, anchor);

    if (tool === 'select') {
      setSelectedId(null);
      return;
    }

    if (tool === 'symbol') {
      const def = CAD_SYMBOLS[activeSymbolType];
      if (!def) return;
      const newSym = {
        id: makeId('sym'),
        kind: 'symbol',
        symbolType: def.id,
        code: def.isArchitectural ? '' : getNextPCode(),
        label: def.label,
        location: '',
        x: pt.x,
        y: pt.y,
        rotation: 0,
        scale: 1,
        material: def.defaultMaterial || '',
        diameter: def.defaultDimension || '',
        posa: def.defaultPosa || '',
      };
      commitDrawing({ ...safeDrawing, elements: [...elements, newSym] });
      setSelectedId(newSym.id);
      return;
    }

    if (tool === 'text') {
      const newTxt = {
        id: makeId('txt'),
        kind: 'text',
        x: pt.x,
        y: pt.y,
        text: 'Mansarda',
        fontSize: 13,
      };
      commitDrawing({ ...safeDrawing, elements: [...elements, newTxt] });
      setSelectedId(newTxt.id);
      setTool('select');
      return;
    }

    if (tool === 'room' || tool === 'hatchWall') {
      if (polyPoints.length === 0) {
        setPolyPoints([pt]);
        setCursorPt(pt);
      } else {
        const start = polyPoints[0];
        if (Math.hypot(pt.x - start.x, pt.y - start.y) < 8) {
          setPolyPoints([]);
          return;
        }
        const newEl =
          tool === 'room'
            ? { id: makeId('room'), kind: 'room', x1: start.x, y1: start.y, x2: pt.x, y2: pt.y, label: 'Locale' }
            : { id: makeId('hw'), kind: 'hatchWall', x1: start.x, y1: start.y, x2: pt.x, y2: pt.y, thickness: 22 };
        commitDrawing({ ...safeDrawing, elements: [...elements, newEl] });
        setSelectedId(newEl.id);
        setPolyPoints([]);
      }
      return;
    }

    if (tool === 'pipe') {
      // Se clicca vicino all'ultimo punto, termina la polilinea
      if (anchor && Math.hypot(pt.x - anchor.x, pt.y - anchor.y) < 8 && polyPoints.length >= 2) {
        finishPolylinePipe(polyPoints);
        return;
      }
      setPolyPoints((prev) => [...prev, pt]);
      setCursorPt(pt);
    }
  };

  const handleSvgDoubleClick = () => {
    if (tool === 'pipe' && polyPoints.length >= 2) {
      finishPolylinePipe(polyPoints);
    }
  };

  const handleSvgPointerMove = (e) => {
    if (dragState) {
      const pt = clientToSvgPoint(e.clientX, e.clientY);
      const nextElements = elements.map((el) => {
        if (el.id !== dragState.id) return el;
        if (dragState.mode === 'pos') {
          return { ...el, x: pt.x, y: pt.y };
        }
        if (dragState.mode === 'p1') return { ...el, x1: pt.x, y1: pt.y };
        if (dragState.mode === 'p2') return { ...el, x2: pt.x, y2: pt.y };
        if (typeof dragState.mode === 'number' && el.kind === 'pipe') {
          const pts = getPipePoints(el).map((p, idx) => (idx === dragState.mode ? pt : p));
          return {
            ...el,
            points: pts,
            lengthMeters: computePipeMeters({ points: pts }, safeDrawing.gridSize, safeDrawing.metersPerCell),
          };
        }
        return el;
      });
      onChangeDrawing({ ...safeDrawing, elements: nextElements });
      return;
    }

    if (polyPoints.length > 0) {
      setCursorPt(clientToSvgPoint(e.clientX, e.clientY, polyPoints[polyPoints.length - 1]));
    }
  };

  const handleSvgPointerUp = () => {
    if (dragState) setDragState(null);
  };

  const startDragSymbol = (e, id) => {
    setSelectedId(id);
    if (tool !== 'select') return;
    setHistory((prev) => [...prev.slice(-24), safeDrawing]);
    setDragState({ id, mode: 'pos' });
  };

  const startDragNode = (e, id, nodeKey) => {
    setHistory((prev) => [...prev.slice(-24), safeDrawing]);
    setDragState({ id, mode: nodeKey });
  };

  const updateSelected = (patch) => {
    if (!selectedId) return;
    const nextElements = elements.map((el) => (el.id === selectedId ? { ...el, ...patch } : el));
    commitDrawing({ ...safeDrawing, elements: nextElements }, false);
  };

  const deleteElement = (id) => {
    commitDrawing({ ...safeDrawing, elements: elements.filter((el) => el.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const handleUploadBackground = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        commitDrawing({ ...safeDrawing, backgroundImage: canvas.toDataURL('image/jpeg', 0.72) });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const draftPoints = useMemo(() => {
    if (!polyPoints.length || !cursorPt) return null;
    return [...polyPoints, cursorPt];
  }, [polyPoints, cursorPt]);

  const visibleSymbols = useMemo(
    () => Object.values(CAD_SYMBOLS).filter((s) => s.category === activeSymbolCategory),
    [activeSymbolCategory],
  );

  return (
    <div className="cad-wrapper">
      {/* TOOLBAR PRINCIPALE */}
      <div className="cad-toolbar">
        <div className="cad-tool-group">
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'select' ? 'is-active' : ''}`}
            onClick={() => { setTool('select'); setPolyPoints([]); }}
          >
            Seleziona
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'hatchWall' ? 'is-active' : ''}`}
            onClick={() => { setTool('hatchWall'); setPolyPoints([]); }}
            title="Muro, solaio o falda tetto con tratteggio CAD 45°"
          >
            Muro / Tetto
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'room' ? 'is-active' : ''}`}
            onClick={() => { setTool('room'); setPolyPoints([]); }}
          >
            Stanza
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'pipe' ? 'is-active' : ''}`}
            onClick={() => { setTool('pipe'); setPolyPoints([]); }}
          >
            Tubazione (Polilinea)
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'symbol' ? 'is-active' : ''}`}
            onClick={() => { setTool('symbol'); setPolyPoints([]); }}
          >
            Simboli
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'text' ? 'is-active' : ''}`}
            onClick={() => { setTool('text'); setPolyPoints([]); }}
          >
            Testo
          </button>
        </div>

        <div className="cad-tool-group">
          <button
            type="button"
            className={`cad-tool-btn ${showGrid ? 'is-toggle-on' : ''}`}
            onClick={() => setShowGrid((v) => !v)}
          >
            Griglia
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${snapToGrid ? 'is-toggle-on' : ''}`}
            onClick={() => setSnapToGrid((v) => !v)}
          >
            Snap
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${orthoMode ? 'is-toggle-on' : ''}`}
            onClick={() => setOrthoMode((v) => !v)}
          >
            Orto 90°/45°
          </button>
          <button
            type="button"
            className="cad-tool-btn"
            onClick={handleUndo}
            disabled={!history.length}
          >
            Annulla
          </button>
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUploadBackground}
          />
          <button
            type="button"
            className="cad-tool-btn"
            onClick={() => bgInputRef.current?.click()}
          >
            Piantina
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSyncMaterials}
          >
            Sincronizza Materiali
          </button>
        </div>
      </div>

      {/* SOTTOBARRA TUBAZIONI */}
      {tool === 'pipe' ? (
        <div className="cad-subbar">
          <span className="small muted" style={{ fontWeight: 600 }}>Linea:</span>
          {Object.values(PIPE_TYPES).map((pt) => (
            <button
              key={pt.id}
              type="button"
              className={`cad-pipe-chip ${activePipeType === pt.id ? 'is-active' : ''}`}
              onClick={() => { setActivePipeType(pt.id); setPolyPoints([]); }}
            >
              <span className="cad-color-dot" style={{ background: pt.color }} />
              {pt.label}
            </button>
          ))}
          {polyPoints.length >= 2 ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => finishPolylinePipe(polyPoints)}
            >
              Completa tubo (Invio)
            </button>
          ) : null}
        </div>
      ) : null}

      {safeDrawing.backgroundImage ? (
        <div className="cad-subbar">
          <span className="small muted">Opacità piantina:</span>
          <input
            type="range"
            min="0.1"
            max="0.85"
            step="0.05"
            value={safeDrawing.backgroundOpacity ?? 0.35}
            onChange={(e) =>
              commitDrawing({ ...safeDrawing, backgroundOpacity: Number(e.target.value) }, false)
            }
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-danger"
            onClick={() => commitDrawing({ ...safeDrawing, backgroundImage: '' })}
          >
            Rimuovi piantina
          </button>
        </div>
      ) : null}

      {/* WORKSPACE CAD */}
      <div className="cad-workspace">
        <aside className="cad-palette">
          <div className="cad-cat-tabs">
            {CAD_SYMBOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cad-cat-tab ${activeSymbolCategory === cat.id ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveSymbolCategory(cat.id);
                  setTool('symbol');
                  setPolyPoints([]);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="cad-symbol-grid">
            {visibleSymbols.map((sym) => {
              const isPicked = tool === 'symbol' && activeSymbolType === sym.id;
              return (
                <button
                  key={sym.id}
                  type="button"
                  className={`cad-symbol-item ${isPicked ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveSymbolType(sym.id);
                    setTool('symbol');
                    setPolyPoints([]);
                  }}
                >
                  <svg viewBox="-52 -52 104 104" width="38" height="38">
                    {renderSymbolGlyph(sym.id)}
                  </svg>
                  <span>{sym.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="cad-canvas-col">
          <div className="cad-canvas-frame">
            <svg
              ref={svgRef}
              className="cad-svg"
              viewBox={`0 0 ${safeDrawing.width} ${safeDrawing.height}`}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerLeave={handleSvgPointerUp}
              onDoubleClick={handleSvgDoubleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                if (tool === 'pipe' && polyPoints.length >= 2) finishPolylinePipe(polyPoints);
                else setPolyPoints([]);
              }}
            >
              <CadSvgRenderer
                drawing={safeDrawing}
                showGrid={showGrid}
                showPorts
                selectedId={selectedId}
                draftPoints={draftPoints}
                draftTool={tool}
                draftColor={PIPE_TYPES[activePipeType]?.color || '#1e293b'}
                interactive
                onSelectElement={(id) => {
                  setSelectedId(id);
                  if (tool !== 'select') setTool('select');
                }}
                onStartDragSymbol={startDragSymbol}
                onStartDragNode={startDragNode}
              />
            </svg>
          </div>

          <div className="cad-status-bar">
            <span>
              {tool === 'select' && 'Clicca un elemento per modificarlo o trascina simboli e nodi dei tubi.'}
              {tool === 'hatchWall' && (polyPoints.length ? 'Clicca il punto finale del muro / solaio / falda.' : 'Clicca il punto iniziale del muro o solaio tratteggiato.')}
              {tool === 'room' && (polyPoints.length ? 'Clicca l’angolo opposto della stanza.' : 'Clicca il primo angolo della stanza.')}
              {tool === 'pipe' && (polyPoints.length ? 'Clicca i punti di curva del tubo. Doppio click, Invio o Tasto Destro per completarlo.' : 'Clicca il punto di partenza della tubazione.')}
              {tool === 'symbol' && `Clicca sul foglio per posizionare: ${CAD_SYMBOLS[activeSymbolType]?.label || ''}`}
              {tool === 'text' && 'Clicca sul foglio per inserire una scritta.'}
            </span>
            <span className="amount">{elements.length} elementi</span>
          </div>
        </div>
      </div>

      {/* INSPECTOR ELEMENTO SELEZIONATO */}
      {selectedEl ? (
        <div className="cad-inspector">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="eyebrow">Proprietà elemento</span>
              <span className="step-num">{selectedEl.code || selectedEl.kind.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selectedEl.kind === 'symbol' ? (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateSelected({ rotation: ((selectedEl.rotation || 0) + 90) % 360 })}
                  >
                    Ruota 90°
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateSelected({ scale: Math.max(0.6, Number(((selectedEl.scale || 1) - 0.15).toFixed(2))) })}
                  >
                    − Scala
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateSelected({ scale: Math.min(2.2, Number(((selectedEl.scale || 1) + 0.15).toFixed(2))) })}
                  >
                    + Scala
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => deleteElement(selectedEl.id)}
              >
                Elimina
              </button>
            </div>
          </div>

          {selectedEl.kind === 'pipe' ? (
            <div className="grid-3">
              <div className="field">
                <label className="field-label">Rif. (Sigla)</label>
                <input
                  className="input"
                  value={selectedEl.code || ''}
                  onChange={(e) => updateSelected({ code: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Ubicazione</label>
                <input
                  className="input"
                  placeholder="Es. Mansarda, Sul Tetto, Bagno"
                  value={selectedEl.location || ''}
                  onChange={(e) => updateSelected({ location: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Materiale</label>
                <input
                  className="input"
                  list="cad-pipe-materials"
                  value={selectedEl.material || ''}
                  onChange={(e) => updateSelected({ material: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Diametro</label>
                <input
                  className="input"
                  list="cad-pipe-diameters"
                  value={selectedEl.diameter || ''}
                  onChange={(e) => updateSelected({ diameter: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Installazione / Posa</label>
                <input
                  className="input"
                  list="cad-pipe-posa"
                  value={selectedEl.posa || ''}
                  onChange={(e) => updateSelected({ posa: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Lunghezza (m)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.05"
                  className="input amount-input"
                  value={selectedEl.lengthMeters ?? ''}
                  onChange={(e) => updateSelected({ lengthMeters: Number(e.target.value) })}
                />
              </div>
              <datalist id="cad-pipe-materials">
                {PIPE_MATERIALS.map((m) => <option key={m} value={m} />)}
              </datalist>
              <datalist id="cad-pipe-diameters">
                {PIPE_DIAMETERS.map((d) => <option key={d} value={d} />)}
              </datalist>
              <datalist id="cad-pipe-posa">
                {PIPE_POSA_OPTIONS.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
          ) : null}

          {selectedEl.kind === 'symbol' && !CAD_SYMBOLS[selectedEl.symbolType]?.isArchitectural ? (
            <div className="grid-3">
              <div className="field">
                <label className="field-label">Rif. (Sigla)</label>
                <input
                  className="input"
                  value={selectedEl.code || ''}
                  onChange={(e) => updateSelected({ code: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Ubicazione</label>
                <input
                  className="input"
                  placeholder="Es. Mansarda, Sul Tetto"
                  value={selectedEl.location || ''}
                  onChange={(e) => updateSelected({ location: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Descrizione componente</label>
                <input
                  className="input"
                  value={selectedEl.label || ''}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                />
              </div>
            </div>
          ) : null}

          {selectedEl.kind === 'hatchWall' ? (
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Spessore muro / solaio (px)</label>
                <input
                  type="number"
                  min="8"
                  max="60"
                  className="input"
                  value={selectedEl.thickness || 22}
                  onChange={(e) => updateSelected({ thickness: Number(e.target.value) || 22 })}
                />
              </div>
            </div>
          ) : null}

          {selectedEl.kind === 'room' ? (
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Nome locale</label>
                <input
                  className="input"
                  value={selectedEl.label || ''}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                />
              </div>
            </div>
          ) : null}

          {selectedEl.kind === 'text' ? (
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Testo etichetta</label>
                <input
                  className="input"
                  value={selectedEl.text || ''}
                  onChange={(e) => updateSelected({ text: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label">Dimensione font (px)</label>
                <input
                  type="number"
                  min="9"
                  max="28"
                  className="input"
                  value={selectedEl.fontSize || 13}
                  onChange={(e) => updateSelected({ fontSize: Number(e.target.value) || 13 })}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}