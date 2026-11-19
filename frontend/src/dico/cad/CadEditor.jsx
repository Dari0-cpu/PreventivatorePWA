import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { makeId } from '../../quote/quoteModel';
import { computePipeMeters } from '../dicoModel';
import {
  CAD_SYMBOLS,
  CAD_SYMBOL_CATEGORIES,
  PIPE_TYPES,
  PIPE_MATERIALS,
  PIPE_DIAMETERS,
  PIPE_POSA_OPTIONS,
  getSymbolWorldPorts,
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

function hatchWallPolygon(x1, y1, x2, y2, thickness = 22) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (thickness / 2);
  const ny = (dx / len) * (thickness / 2);
  return `${x1 + nx},${y1 + ny} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny} ${x1 - nx},${y1 - ny}`;
}

/**
 * Renderer SVG a livelli separati:
 * 1. Stanze e muri tratteggiati
 * 2. Linee tubazioni (più chiare, SEMPRE dietro ai simboli)
 * 3. Simboli tecnici (con corpo bianco opaco)
 * 4. Etichette, quote tubi, porte cliccabili e maniglie di modifica
 */
export function CadSvgRenderer({
  drawing,
  showGrid = true,
  showPorts = true,
  selectedId = null,
  activeTool = 'select',
  hoveredPort = null,
  draftPoints = null,
  draftTool = null,
  draftColor = '#3b82f6',
  interactive = false,
  onSelectElement,
  onStartDragElement,
  onStartDragNode,
  onInsertPipeNode,
  onRemovePipeNode,
  onClickPort,
}) {
  const width = drawing?.width || DEFAULT_W;
  const height = drawing?.height || DEFAULT_H;
  const gridSize = drawing?.gridSize || DEFAULT_GRID;
  const elements = Array.isArray(drawing?.elements) ? drawing.elements : [];

  const rooms = useMemo(() => elements.filter((e) => e.kind === 'room'), [elements]);
  const walls = useMemo(
    () => elements.filter((e) => e.kind === 'hatchWall' || e.kind === 'wall'),
    [elements],
  );
  const pipes = useMemo(() => elements.filter((e) => e.kind === 'pipe'), [elements]);
  const symbols = useMemo(() => elements.filter((e) => e.kind === 'symbol'), [elements]);
  const texts = useMemo(() => elements.filter((e) => e.kind === 'text'), [elements]);

  const allPorts = useMemo(() => {
    if (!interactive) return [];
    return symbols.flatMap((sym) => getSymbolWorldPorts(sym));
  }, [interactive, symbols]);

  const canSelect = interactive && activeTool === 'select';

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
        <pattern id="cad-hatch-45" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.1" />
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

      {/* ==================== LIVELLO 1: STANZE ==================== */}
      {rooms.map((el) => {
        const isSel = interactive && el.id === selectedId;
        const x = Math.min(el.x1, el.x2);
        const y = Math.min(el.y1, el.y2);
        const w = Math.abs(el.x2 - el.x1);
        const h = Math.abs(el.y2 - el.y1);
        return (
          <g key={el.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="#f8fafc"
              fillOpacity="0.45"
              stroke={isSel ? '#14532d' : '#334155'}
              strokeWidth={isSel ? 6 : 5}
              style={{
                cursor: canSelect ? 'move' : 'inherit',
                pointerEvents: canSelect ? 'stroke' : 'none',
              }}
              onPointerDown={(e) => {
                if (!canSelect) return;
                e.stopPropagation();
                onStartDragElement?.(e, el);
              }}
            />
            {el.label ? (
              <text
                x={x + w / 2}
                y={y + 20}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                letterSpacing="0.06em"
                fill="#64748b"
                style={{
                  cursor: canSelect ? 'move' : 'inherit',
                  pointerEvents: canSelect ? 'all' : 'none',
                  userSelect: 'none',
                }}
                onPointerDown={(e) => {
                  if (!canSelect) return;
                  e.stopPropagation();
                  onStartDragElement?.(e, el);
                }}
              >
                {el.label.toUpperCase()}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* ==================== LIVELLO 2: MURI / SOLAI / TETTI ==================== */}
      {walls.map((el) => {
        const isSel = interactive && el.id === selectedId;
        if (el.kind === 'hatchWall') {
          const poly = hatchWallPolygon(el.x1, el.y1, el.x2, el.y2, el.thickness || 22);
          return (
            <polygon
              key={el.id}
              points={poly}
              fill="url(#cad-hatch-45)"
              stroke={isSel ? '#14532d' : '#334155'}
              strokeWidth={isSel ? 2 : 1.1}
              style={{
                cursor: canSelect ? 'move' : 'inherit',
                pointerEvents: canSelect ? 'all' : 'none',
              }}
              onPointerDown={(e) => {
                if (!canSelect) return;
                e.stopPropagation();
                onStartDragElement?.(e, el);
              }}
            />
          );
        }
        return (
          <g key={el.id}>
            {canSelect ? (
              <line
                x1={el.x1}
                y1={el.y1}
                x2={el.x2}
                y2={el.y2}
                stroke="transparent"
                strokeWidth="16"
                style={{ cursor: 'move' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onStartDragElement?.(e, el);
                }}
              />
            ) : null}
            <line
              x1={el.x1}
              y1={el.y1}
              x2={el.x2}
              y2={el.y2}
              stroke={isSel ? '#14532d' : '#334155'}
              strokeWidth="5"
              strokeLinecap="square"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      })}

      {/* ==================== LIVELLO 3: LINEE TUBI (DIETRO AI SIMBOLI) ==================== */}
      {pipes.map((el) => {
        const isSel = interactive && el.id === selectedId;
        const preset = PIPE_TYPES[el.pipeType] || PIPE_TYPES.acqua_fredda;
        const pts = getPipePoints(el);
        const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

        return (
          <g key={el.id}>
            {canSelect ? (
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
              strokeOpacity={isSel ? 1 : 0.72}
              strokeDasharray={preset.dash || undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      })}

      {/* ==================== LIVELLO 4: SIMBOLI TECNICI (SOPRA AI TUBI) ==================== */}
      {symbols.map((el) => {
        const isSel = interactive && el.id === selectedId;
        const def = CAD_SYMBOLS[el.symbolType];
        const sc = el.scale || 1;

        return (
          <g
            key={el.id}
            transform={`translate(${el.x}, ${el.y})`}
            style={{
              cursor: canSelect ? 'grab' : 'inherit',
              pointerEvents: canSelect ? 'all' : 'none',
            }}
            onPointerDown={(e) => {
              if (!canSelect) return;
              e.stopPropagation();
              onStartDragElement?.(e, el);
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
                fillOpacity="0.45"
                stroke="#14532d"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            ) : null}
            <g transform={`rotate(${el.rotation || 0}) scale(${sc})`}>
              {renderSymbolGlyph(el.symbolType, {
                showPorts: showPorts && !interactive && !def?.isArchitectural,
              })}
            </g>
            {el.code && !def?.isArchitectural ? (
              <text
                x={-32 * sc}
                y={4}
                textAnchor="end"
                fontSize="12.5"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
                fill="#991b1b"
                paintOrder="stroke"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinejoin="round"
                style={{ userSelect: 'none' }}
              >
                {el.code}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* ==================== LIVELLO 5: QUOTE TUBI + TESTI ==================== */}
      {pipes.map((el) => {
        const preset = PIPE_TYPES[el.pipeType] || PIPE_TYPES.acqua_fredda;
        const pts = getPipePoints(el);
        const seg = getLongestSegment(pts);
        const len =
          Number(el.lengthMeters) ||
          computePipeMeters(el, drawing?.gridSize, drawing?.metersPerCell);
        const specText = `${len.toFixed(2).replace('.', ',')} m${el.diameter ? ` - ${el.diameter}` : ''}`;
        const matText = el.material || preset.short;

        return (
          <g key={`lbl-${el.id}`} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {seg.len >= 38 ? (
              <g transform={`translate(${seg.mx}, ${seg.my}) rotate(${seg.angle})`}>
                <text
                  x="0"
                  y="-6"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#1e3a8a"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                >
                  {el.code ? `${el.code} · ${matText}` : matText}
                </text>
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#334155"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                >
                  {specText}
                </text>
              </g>
            ) : el.code ? (
              <text
                x={seg.mx}
                y={seg.my - 7}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
                fill="#991b1b"
                paintOrder="stroke"
                stroke="#ffffff"
                strokeWidth="3"
              >
                {el.code}
              </text>
            ) : null}
          </g>
        );
      })}

      {texts.map((el) => {
        const isSel = interactive && el.id === selectedId;
        return (
          <g
            key={el.id}
            transform={`translate(${el.x}, ${el.y})`}
            style={{
              cursor: canSelect ? 'grab' : 'inherit',
              pointerEvents: canSelect ? 'all' : 'none',
            }}
            onPointerDown={(e) => {
              if (!canSelect) return;
              e.stopPropagation();
              onStartDragElement?.(e, el);
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
              paintOrder="stroke"
              stroke="#ffffff"
              strokeWidth="3"
              style={{ userSelect: 'none' }}
            >
              {el.text || 'Etichetta'}
            </text>
          </g>
        );
      })}

      {/* ==================== LIVELLO 6: PORTE DI ATTACCO INTERATTIVE ==================== */}
      {interactive && showPorts && (activeTool === 'select' || activeTool === 'pipe')
        ? allPorts.map((port) => {
            const isHovered = hoveredPort?.id === port.id;
            const isPipeMode = activeTool === 'pipe';
            return (
              <g
                key={port.id}
                transform={`translate(${port.x}, ${port.y})`}
                className="cad-port-group"
                style={{ cursor: 'crosshair' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onClickPort?.(port);
                }}
              >
                <title>{`${port.symbolCode} — ${port.label} (clicca per collegare un tubo)`}</title>
                {/* Area cliccabile comoda anche da touch */}
                <circle cx="0" cy="0" r="10" fill="transparent" />
                {isHovered ? (
                  <circle
                    cx="0"
                    cy="0"
                    r="8.5"
                    fill="#dcfce7"
                    fillOpacity="0.85"
                    stroke="#15803d"
                    strokeWidth="2"
                  />
                ) : null}
                <circle
                  cx="0"
                  cy="0"
                  r={isHovered ? 4.5 : isPipeMode ? 4 : 3}
                  fill={isHovered ? '#15803d' : '#ffffff'}
                  stroke={isHovered ? '#ffffff' : isPipeMode ? '#15803d' : '#dc2626'}
                  strokeWidth="1.5"
                />
              </g>
            );
          })
        : null}

      {/* ==================== LIVELLO 7: MANIGLIE ELEMENTO SELEZIONATO ==================== */}
      {canSelect && selectedId
        ? (() => {
            const sel = elements.find((e) => e.id === selectedId);
            if (!sel) return null;

            if (sel.kind === 'room' || sel.kind === 'hatchWall' || sel.kind === 'wall') {
              return (
                <g>
                  <circle
                    cx={sel.x1}
                    cy={sel.y1}
                    r="6"
                    fill="#ffffff"
                    stroke="#14532d"
                    strokeWidth="2.4"
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDragNode?.(e, sel.id, 'p1');
                    }}
                  />
                  <circle
                    cx={sel.x2}
                    cy={sel.y2}
                    r="6"
                    fill="#ffffff"
                    stroke="#14532d"
                    strokeWidth="2.4"
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onStartDragNode?.(e, sel.id, 'p2');
                    }}
                  />
                </g>
              );
            }

            if (sel.kind === 'pipe') {
              const pts = getPipePoints(sel);
              return (
                <g>
                  {/* Maniglie '+' sui punti medi per aggiungere curve/gomiti */}
                  {pts.slice(0, -1).map((p, idx) => {
                    const next = pts[idx + 1];
                    if (Math.hypot(next.x - p.x, next.y - p.y) < 28) return null;
                    const mx = (p.x + next.x) / 2;
                    const my = (p.y + next.y) / 2;
                    return (
                      <g
                        key={`mid-${idx}`}
                        transform={`translate(${mx}, ${my})`}
                        style={{ cursor: 'copy' }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onInsertPipeNode?.(sel.id, idx + 1, { x: Math.round(mx), y: Math.round(my) });
                        }}
                      >
                        <title>Clicca per aggiungere una curva (gomito)</title>
                        <circle cx="0" cy="0" r="6" fill="#f0fdf4" stroke="#15803d" strokeWidth="1.2" />
                        <line x1="-3" y1="0" x2="3" y2="0" stroke="#15803d" strokeWidth="1.4" />
                        <line x1="0" y1="-3" x2="0" y2="3" stroke="#15803d" strokeWidth="1.4" />
                      </g>
                    );
                  })}

                  {/* Vertici trascinabili (doppio click per rimuovere nodo intermedio) */}
                  {pts.map((p, idx) => (
                    <circle
                      key={`v-${idx}`}
                      cx={p.x}
                      cy={p.y}
                      r="6"
                      fill="#ffffff"
                      stroke="#14532d"
                      strokeWidth="2.4"
                      style={{ cursor: 'grab' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onStartDragNode?.(e, sel.id, idx);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (pts.length > 2) onRemovePipeNode?.(sel.id, idx);
                      }}
                    >
                      <title>Trascina per spostare (doppio click per rimuovere il gomito)</title>
                    </circle>
                  ))}
                </g>
              );
            }

            return null;
          })()
        : null}

      {/* ==================== ANTEPRIMA LIVE DISEGNO ==================== */}
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
              strokeWidth="2.5"
              strokeOpacity="0.8"
              strokeDasharray="6 3"
            />
          )}
          {draftPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#14532d" />
          ))}
        </g>
      ) : null}

      {/* Etichetta tooltip di aggancio magnetico */}
      {interactive && hoveredPort && activeTool === 'pipe' ? (
        <g transform={`translate(${hoveredPort.x}, ${hoveredPort.y - 16})`} style={{ pointerEvents: 'none' }}>
          <rect
            x="-58"
            y="-12"
            width="116"
            height="17"
            rx="4"
            fill="#14532d"
          />
          <text x="0" y="0" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#ffffff">
            {hoveredPort.label}
          </text>
        </g>
      ) : null}
    </>
  );
}

/**
 * Editor CAD 2D con Zoom/Pan, aggancio magnetico alle porte dei simboli,
 * avvio tubo diretto dai bordini, polilinee con gomiti e ritorno automatico a Seleziona.
 */
export function CadEditor({ drawing, onChangeDrawing, onSyncMaterials }) {
  const svgRef = useRef(null);
  const bgInputRef = useRef(null);

  const [tool, setTool] = useState('select'); // 'select' | 'pan' | 'pipe' | 'hatchWall' | 'room' | 'symbol' | 'text'
  const [continuousDraw, setContinuousDraw] = useState(false);
  const [activePipeType, setActivePipeType] = useState('frigo_mandata');
  const [activeSymbolCategory, setActiveSymbolCategory] = useState('clima');
  const [activeSymbolType, setActiveSymbolType] = useState('split_pavimento');

  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [orthoMode, setOrthoMode] = useState(true);

  const [polyPoints, setPolyPoints] = useState([]);
  const [cursorPt, setCursorPt] = useState(null);
  const [hoveredPort, setHoveredPort] = useState(null);
  const [startPortSymbolId, setStartPortSymbolId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [panState, setPanState] = useState(null);
  const [spacePressed, setSpacePressed] = useState(false);
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

  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    w: safeDrawing.width || DEFAULT_W,
    h: safeDrawing.height || DEFAULT_H,
  });

  const elements = safeDrawing.elements || [];
  const selectedEl = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId],
  );

  const allPorts = useMemo(
    () => elements.filter((e) => e.kind === 'symbol').flatMap((sym) => getSymbolWorldPorts(sym)),
    [elements],
  );

  const zoomPercent = Math.round(((safeDrawing.width || DEFAULT_W) / viewBox.w) * 100);

  const commitDrawing = useCallback(
    (nextDrawing, recordUndo = true) => {
      if (recordUndo) {
        setHistory((prev) => [...prev.slice(-24), safeDrawing]);
      }
      onChangeDrawing(nextDrawing);
    },
    [onChangeDrawing, safeDrawing],
  );

  const getNextPCode = useCallback(() => {
    let maxN = 0;
    elements.forEach((el) => {
      const m = String(el.code || '').match(/^P(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxN) maxN = n;
      }
    });
    return `P${maxN + 1}`;
  }, [elements]);

  const finishPolylinePipe = useCallback(
    (rawPts = polyPoints) => {
      // Rimuove eventuali punti duplicati consecutivi (es. da doppio click)
      const cleaned = rawPts.filter(
        (pt, idx) => idx === 0 || Math.hypot(pt.x - rawPts[idx - 1].x, pt.y - rawPts[idx - 1].y) >= 4,
      );
      if (cleaned.length < 2) {
        setPolyPoints([]);
        setStartPortSymbolId(null);
        return;
      }
      const preset = PIPE_TYPES[activePipeType] || PIPE_TYPES.acqua_fredda;
      const lengthMeters = computePipeMeters(
        { points: cleaned },
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
        points: cleaned,
      };
      commitDrawing({ ...safeDrawing, elements: [...elements, newPipe] });
      setSelectedId(newPipe.id);
      setPolyPoints([]);
      setStartPortSymbolId(null);
      if (!continuousDraw) {
        setTool('select');
      }
    },
    [activePipeType, commitDrawing, continuousDraw, elements, getNextPCode, polyPoints, safeDrawing],
  );

  const screenToSvgRaw = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const transformed = pt.matrixTransform(ctm.inverse());
        return { x: transformed.x, y: transformed.y };
      }
      const rect = svg.getBoundingClientRect();
      return {
        x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w,
        y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h,
      };
    },
    [viewBox],
  );

  /** Trova la porta magnetica più vicina entro un raggio scalato allo zoom. */
  const findNearestPort = useCallback(
    (rawPt) => {
      const threshold = Math.max(10, (viewBox.w / DEFAULT_W) * 18);
      let best = null;
      let bestDist = threshold;
      for (let i = 0; i < allPorts.length; i += 1) {
        const d = Math.hypot(allPorts[i].x - rawPt.x, allPorts[i].y - rawPt.y);
        if (d < bestDist) {
          bestDist = d;
          best = allPorts[i];
        }
      }
      return best;
    },
    [allPorts, viewBox.w],
  );

  const snapWorldPoint = useCallback(
    (rawPt, anchor = null, allowPortSnap = true) => {
      if (allowPortSnap) {
        const port = findNearestPort(rawPt);
        if (port) {
          return { x: port.x, y: port.y, snappedPort: port };
        }
      }

      let x = rawPt.x;
      let y = rawPt.y;
      const g = (safeDrawing.gridSize || DEFAULT_GRID) / 2;

      if (snapToGrid) {
        x = Math.round(x / g) * g;
        y = Math.round(y / g) * g;
      }

      if (anchor && orthoMode && (tool === 'pipe' || tool === 'hatchWall')) {
        const dx = Math.abs(x - anchor.x);
        const dy = Math.abs(y - anchor.y);
        if (dx > dy * 2.2) {
          y = anchor.y;
        } else if (dy > dx * 2.2) {
          x = anchor.x;
        }
      }

      x = Math.max(6, Math.min(safeDrawing.width - 6, Math.round(x)));
      y = Math.max(6, Math.min(safeDrawing.height - 6, Math.round(y)));
      return { x, y, snappedPort: null };
    },
    [findNearestPort, orthoMode, safeDrawing.gridSize, safeDrawing.height, safeDrawing.width, snapToGrid, tool],
  );

  /* --- Zoom controllato (pulsanti e rotella mouse) --- */
  const applyZoom = useCallback(
    (factor, focal = null) => {
      setViewBox((prev) => {
        const baseW = safeDrawing.width || DEFAULT_W;
        const baseH = safeDrawing.height || DEFAULT_H;
        const nextW = Math.max(baseW / 4, Math.min(baseW * 1.4, prev.w * factor));
        const nextH = (nextW / baseW) * baseH;
        const fx = focal ? focal.x : prev.x + prev.w / 2;
        const fy = focal ? focal.y : prev.y + prev.h / 2;
        const ratio = nextW / prev.w;
        return {
          x: fx - (fx - prev.x) * ratio,
          y: fy - (fy - prev.y) * ratio,
          w: nextW,
          h: nextH,
        };
      });
    },
    [safeDrawing.height, safeDrawing.width],
  );

  const resetZoom = useCallback(() => {
    setViewBox({
      x: 0,
      y: 0,
      w: safeDrawing.width || DEFAULT_W,
      h: safeDrawing.height || DEFAULT_H,
    });
  }, [safeDrawing.height, safeDrawing.width]);

  // Listener nativo rotella mouse (non-passive per bloccare lo scroll pagina sul CAD)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const focal = screenToSvgRaw(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 0.86 : 1.16;
      applyZoom(factor, focal);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [applyZoom, screenToSvgRaw]);

  // Scorciatoie tastiera: Spazio=Pan, Esc/Invio=Completa tubo, Canc=Elimina
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      } else if (e.key === 'Escape' || e.key === 'Enter') {
        if (tool === 'pipe' && polyPoints.length >= 2) {
          finishPolylinePipe(polyPoints);
        } else {
          setPolyPoints([]);
          setStartPortSymbolId(null);
          setSelectedId(null);
          setTool('select');
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        commitDrawing({ ...safeDrawing, elements: elements.filter((el) => el.id !== selectedId) });
        setSelectedId(null);
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [commitDrawing, elements, finishPolylinePipe, polyPoints, safeDrawing, selectedId, tool]);

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onChangeDrawing(prev);
    setPolyPoints([]);
    setStartPortSymbolId(null);
  };

  /* --- Click diretto su una porta di attacco (anche da modalità Seleziona!) --- */
  const handleClickPort = (port) => {
    if (tool === 'pipe' && polyPoints.length > 0) {
      const nextPts = [...polyPoints, { x: port.x, y: port.y }];
      // Se collego a un altro simbolo (o ho già almeno 2 punti), chiude subito il tubo!
      if (port.symbolId !== startPortSymbolId || nextPts.length >= 2) {
        finishPolylinePipe(nextPts);
        return;
      }
    }

    // Fa partire subito il tubo esattamente da questa porta
    setTool('pipe');
    setSelectedId(null);
    setStartPortSymbolId(port.symbolId);
    setPolyPoints([{ x: port.x, y: port.y }]);
    setCursorPt({ x: port.x, y: port.y });
  };

  const handleSvgPointerDown = (e) => {
    // Tasto destro chiude il tubo o torna a seleziona
    if (e.button === 2) {
      if (tool === 'pipe' && polyPoints.length >= 2) finishPolylinePipe(polyPoints);
      else {
        setPolyPoints([]);
        setStartPortSymbolId(null);
        setTool('select');
      }
      return;
    }

    // Pan con tasto centrale, strumento Mano, oppure Spazio + click
    if (e.button === 1 || tool === 'pan' || spacePressed) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanState({
        clientX: e.clientX,
        clientY: e.clientY,
        vbX: viewBox.x,
        vbY: viewBox.y,
        scaleX: viewBox.w / rect.width,
        scaleY: viewBox.h / rect.height,
      });
      return;
    }

    const rawPt = screenToSvgRaw(e.clientX, e.clientY);
    const anchor = polyPoints.length > 0 ? polyPoints[polyPoints.length - 1] : null;
    const snapped = snapWorldPoint(rawPt, anchor, tool === 'pipe');

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
        x: snapped.x,
        y: snapped.y,
        rotation: 0,
        scale: 1,
        material: def.defaultMaterial || '',
        diameter: def.defaultDimension || '',
        posa: def.defaultPosa || '',
      };
      commitDrawing({ ...safeDrawing, elements: [...elements, newSym] });
      setSelectedId(newSym.id);
      if (!continuousDraw) setTool('select');
      return;
    }

    if (tool === 'text') {
      const newTxt = {
        id: makeId('txt'),
        kind: 'text',
        x: snapped.x,
        y: snapped.y,
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
        setPolyPoints([{ x: snapped.x, y: snapped.y }]);
        setCursorPt({ x: snapped.x, y: snapped.y });
      } else {
        const start = polyPoints[0];
        if (Math.hypot(snapped.x - start.x, snapped.y - start.y) < 8) {
          setPolyPoints([]);
          return;
        }
        const newEl =
          tool === 'room'
            ? { id: makeId('room'), kind: 'room', x1: start.x, y1: start.y, x2: snapped.x, y2: snapped.y, label: 'Locale' }
            : { id: makeId('hw'), kind: 'hatchWall', x1: start.x, y1: start.y, x2: snapped.x, y2: snapped.y, thickness: 22 };
        commitDrawing({ ...safeDrawing, elements: [...elements, newEl] });
        setSelectedId(newEl.id);
        setPolyPoints([]);
        if (!continuousDraw) setTool('select');
      }
      return;
    }

    if (tool === 'pipe') {
      // Se clicca vicino all'ultimo punto e ha almeno 2 punti, chiude il tubo
      if (anchor && Math.hypot(snapped.x - anchor.x, snapped.y - anchor.y) < 8 && polyPoints.length >= 2) {
        finishPolylinePipe(polyPoints);
        return;
      }

      // Se si aggancia a una porta di destinazione, chiude subito il collegamento
      if (snapped.snappedPort && polyPoints.length >= 1 && snapped.snappedPort.symbolId !== startPortSymbolId) {
        finishPolylinePipe([...polyPoints, { x: snapped.x, y: snapped.y }]);
        return;
      }

      if (polyPoints.length === 0 && snapped.snappedPort) {
        setStartPortSymbolId(snapped.snappedPort.symbolId);
      }
      setPolyPoints((prev) => [...prev, { x: snapped.x, y: snapped.y }]);
      setCursorPt({ x: snapped.x, y: snapped.y });
    }
  };

  const handleSvgDoubleClick = () => {
    if (tool === 'pipe' && polyPoints.length >= 2) {
      finishPolylinePipe(polyPoints);
    }
  };

  const handleSvgPointerMove = (e) => {
    if (panState) {
      const dx = (e.clientX - panState.clientX) * panState.scaleX;
      const dy = (e.clientY - panState.clientY) * panState.scaleY;
      setViewBox((prev) => ({ ...prev, x: panState.vbX - dx, y: panState.vbY - dy }));
      return;
    }

    const rawPt = screenToSvgRaw(e.clientX, e.clientY);

    if (dragState) {
      const isPipeNode = typeof dragState.mode === 'number';
      const snapped = snapWorldPoint(rawPt, null, isPipeNode);
      setHoveredPort(snapped.snappedPort);

      const nextElements = elements.map((el) => {
        if (el.id !== dragState.id) return el;

        if (dragState.mode === 'moveSymbol') {
          const nx = Math.round((rawPt.x - dragState.offsetX) / (snapToGrid ? 10 : 1)) * (snapToGrid ? 10 : 1);
          const ny = Math.round((rawPt.y - dragState.offsetY) / (snapToGrid ? 10 : 1)) * (snapToGrid ? 10 : 1);
          return { ...el, x: nx, y: ny };
        }
        if (dragState.mode === 'moveBox') {
          const dx = Math.round((rawPt.x - dragState.startX) / (snapToGrid ? 10 : 1)) * (snapToGrid ? 10 : 1);
          const dy = Math.round((rawPt.y - dragState.startY) / (snapToGrid ? 10 : 1)) * (snapToGrid ? 10 : 1);
          return {
            ...el,
            x1: dragState.origX1 + dx,
            y1: dragState.origY1 + dy,
            x2: dragState.origX2 + dx,
            y2: dragState.origY2 + dy,
          };
        }
        if (dragState.mode === 'p1') return { ...el, x1: snapped.x, y1: snapped.y };
        if (dragState.mode === 'p2') return { ...el, x2: snapped.x, y2: snapped.y };
        if (isPipeNode && el.kind === 'pipe') {
          const pts = getPipePoints(el).map((p, idx) => (idx === dragState.mode ? { x: snapped.x, y: snapped.y } : p));
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

    // Hover porte magnetiche (sia in Seleziona che in Tubazione)
    if (tool === 'pipe' || tool === 'select') {
      setHoveredPort(findNearestPort(rawPt));
    } else if (hoveredPort) {
      setHoveredPort(null);
    }

    if (polyPoints.length > 0) {
      const snapped = snapWorldPoint(rawPt, polyPoints[polyPoints.length - 1], tool === 'pipe');
      setCursorPt({ x: snapped.x, y: snapped.y });
    }
  };

  const handleSvgPointerUp = () => {
    if (dragState) setDragState(null);
    if (panState) setPanState(null);
  };

  const handleStartDragElement = (e, el) => {
    setSelectedId(el.id);
    if (tool !== 'select') return;
    const rawPt = screenToSvgRaw(e.clientX, e.clientY);
    setHistory((prev) => [...prev.slice(-24), safeDrawing]);

    if (el.kind === 'symbol' || el.kind === 'text') {
      setDragState({
        id: el.id,
        mode: 'moveSymbol',
        offsetX: rawPt.x - el.x,
        offsetY: rawPt.y - el.y,
      });
    } else if (el.kind === 'room' || el.kind === 'hatchWall' || el.kind === 'wall') {
      setDragState({
        id: el.id,
        mode: 'moveBox',
        startX: rawPt.x,
        startY: rawPt.y,
        origX1: el.x1,
        origY1: el.y1,
        origX2: el.x2,
        origY2: el.y2,
      });
    }
  };

  const handleStartDragNode = (e, id, nodeKey) => {
    setHistory((prev) => [...prev.slice(-24), safeDrawing]);
    setDragState({ id, mode: nodeKey });
  };

  const handleInsertPipeNode = (pipeId, insertIndex, pt) => {
    const nextElements = elements.map((el) => {
      if (el.id !== pipeId || el.kind !== 'pipe') return el;
      const pts = [...getPipePoints(el)];
      pts.splice(insertIndex, 0, pt);
      return {
        ...el,
        points: pts,
        lengthMeters: computePipeMeters({ points: pts }, safeDrawing.gridSize, safeDrawing.metersPerCell),
      };
    });
    commitDrawing({ ...safeDrawing, elements: nextElements });
    setDragState({ id: pipeId, mode: insertIndex });
  };

  const handleRemovePipeNode = (pipeId, removeIndex) => {
    const nextElements = elements.map((el) => {
      if (el.id !== pipeId || el.kind !== 'pipe') return el;
      const pts = getPipePoints(el);
      if (pts.length <= 2) return el;
      const filtered = pts.filter((_, idx) => idx !== removeIndex);
      return {
        ...el,
        points: filtered,
        lengthMeters: computePipeMeters({ points: filtered }, safeDrawing.gridSize, safeDrawing.metersPerCell),
      };
    });
    commitDrawing({ ...safeDrawing, elements: nextElements });
  };

  const updateSelected = (patch) => {
    if (!selectedId) return;
    const nextElements = elements.map((el) => (el.id === selectedId ? { ...el, ...patch } : el));
    commitDrawing({ ...safeDrawing, elements: nextElements }, false);
  };

  const duplicateSelected = () => {
    if (!selectedEl) return;
    const copy = {
      ...selectedEl,
      id: makeId(selectedEl.kind),
      code:
        selectedEl.code && !CAD_SYMBOLS[selectedEl.symbolType]?.isArchitectural
          ? getNextPCode()
          : selectedEl.code || '',
    };
    if (copy.kind === 'symbol' || copy.kind === 'text') {
      copy.x += 30;
      copy.y += 30;
    } else if (copy.kind === 'room' || copy.kind === 'hatchWall') {
      copy.x1 += 30;
      copy.y1 += 30;
      copy.x2 += 30;
      copy.y2 += 30;
    } else if (copy.kind === 'pipe') {
      copy.points = getPipePoints(copy).map((p) => ({ x: p.x + 20, y: p.y + 20 }));
    }
    commitDrawing({ ...safeDrawing, elements: [...elements, copy] });
    setSelectedId(copy.id);
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
            className={`cad-tool-btn ${tool === 'pan' ? 'is-active' : ''}`}
            onClick={() => { setTool('pan'); setPolyPoints([]); }}
            title="Sposta il foglio (oppure tieni premuto Spazio e trascina)"
          >
            Mano
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${tool === 'hatchWall' ? 'is-active' : ''}`}
            onClick={() => { setTool('hatchWall'); setPolyPoints([]); }}
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
            Tubazione
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
          {/* CONTROLLI ZOOM */}
          <div className="cad-zoom-group">
            <button
              type="button"
              className="cad-tool-btn"
              onClick={() => applyZoom(1.25)}
              title="Rimpicciolisci"
            >
              −
            </button>
            <button
              type="button"
              className="cad-tool-btn"
              onClick={resetZoom}
              title="Ripristina zoom 100%"
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              className="cad-tool-btn"
              onClick={() => applyZoom(0.8)}
              title="Ingrandisci sui dettagli"
            >
              +
            </button>
          </div>

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
            Orto
          </button>
          <button
            type="button"
            className={`cad-tool-btn ${continuousDraw ? 'is-toggle-on' : ''}`}
            onClick={() => setContinuousDraw((v) => !v)}
            title="Se attivo, resta sullo strumento corrente dopo aver piazzato un elemento"
          >
            Posa continua
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

      {/* SOTTOBARRA TUBAZIONI (sempre visibile quando scegli Tubazione o clicchi un pallino porta) */}
      <div className="cad-subbar">
        <span className="small muted" style={{ fontWeight: 600 }}>Linea tubo attiva:</span>
        {Object.values(PIPE_TYPES).map((pt) => (
          <button
            key={pt.id}
            type="button"
            className={`cad-pipe-chip ${activePipeType === pt.id ? 'is-active' : ''}`}
            onClick={() => {
              setActivePipeType(pt.id);
              setTool('pipe');
              setPolyPoints([]);
            }}
          >
            <span className="cad-color-dot" style={{ background: pt.color }} />
            {pt.short}
          </button>
        ))}
        {tool === 'pipe' && polyPoints.length >= 2 ? (
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
                  <svg viewBox="-52 -58 104 116" width="38" height="38">
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
              style={{
                cursor:
                  panState
                    ? 'grabbing'
                    : tool === 'pan' || spacePressed
                      ? 'grab'
                      : tool === 'select'
                        ? 'default'
                        : 'crosshair',
              }}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerLeave={handleSvgPointerUp}
              onDoubleClick={handleSvgDoubleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                if (tool === 'pipe' && polyPoints.length >= 2) finishPolylinePipe(polyPoints);
                else {
                  setPolyPoints([]);
                  setTool('select');
                }
              }}
            >
              <CadSvgRenderer
                drawing={safeDrawing}
                showGrid={showGrid}
                showPorts
                selectedId={selectedId}
                activeTool={spacePressed ? 'pan' : tool}
                hoveredPort={hoveredPort}
                draftPoints={draftPoints}
                draftTool={tool}
                draftColor={PIPE_TYPES[activePipeType]?.color || '#3b82f6'}
                interactive
                onSelectElement={(id) => setSelectedId(id)}
                onStartDragElement={handleStartDragElement}
                onStartDragNode={handleStartDragNode}
                onInsertPipeNode={handleInsertPipeNode}
                onRemovePipeNode={handleRemovePipeNode}
                onClickPort={handleClickPort}
              />
            </svg>
          </div>

          <div className="cad-status-bar">
            <span>
              {tool === 'select' &&
                'Trascina simboli/stanze o clicca un pallino rosso su un simbolo per far partire subito un tubo. Rotella mouse = Zoom.'}
              {tool === 'pan' && 'Trascina il foglio per spostarti. Usa + / − o la rotella per lo zoom.'}
              {tool === 'hatchWall' &&
                (polyPoints.length
                  ? 'Clicca il punto finale del muro / solaio / falda.'
                  : 'Clicca il punto iniziale del muro tratteggiato.')}
              {tool === 'room' &&
                (polyPoints.length
                  ? 'Clicca l’angolo opposto della stanza.'
                  : 'Clicca il primo angolo della stanza.')}
              {tool === 'pipe' &&
                (polyPoints.length
                  ? 'Clicca per fare una curva, oppure clicca il pallino di arrivo su un simbolo per collegare e chiudere.'
                  : 'Clicca un pallino su un simbolo (o un punto libero) per iniziare il tubo.')}
              {tool === 'symbol' && `Clicca sul foglio per posizionare: ${CAD_SYMBOLS[activeSymbolType]?.label || ''}`}
              {tool === 'text' && 'Clicca sul foglio per inserire una scritta.'}
            </span>
            <span className="amount">{elements.length} elementi · {zoomPercent}%</span>
          </div>
        </div>
      </div>

      {/* INSPECTOR ELEMENTO SELEZIONATO */}
      {selectedEl ? (
        <div className="cad-inspector">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="eyebrow">Elemento selezionato</span>
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
                    onClick={() =>
                      updateSelected({ scale: Math.max(0.6, Number(((selectedEl.scale || 1) - 0.15).toFixed(2))) })
                    }
                  >
                    − Scala
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      updateSelected({ scale: Math.min(2.2, Number(((selectedEl.scale || 1) + 0.15).toFixed(2))) })
                    }
                  >
                    + Scala
                  </button>
                </>
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={duplicateSelected}>
                Duplica
              </button>
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
                <label className="field-label">Tipo linea</label>
                <select
                  className="select"
                  value={selectedEl.pipeType || 'acqua_fredda'}
                  onChange={(e) => {
                    const p = PIPE_TYPES[e.target.value];
                    updateSelected({
                      pipeType: e.target.value,
                      material: p?.defaultMaterial || selectedEl.material,
                      diameter: p?.defaultDiameter || selectedEl.diameter,
                    });
                  }}
                >
                  {Object.values(PIPE_TYPES).map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
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
                <label className="field-label">Lunghezza (m) · Posa</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number"
                    min="0.1"
                    step="0.05"
                    className="input amount-input"
                    style={{ width: 92 }}
                    value={selectedEl.lengthMeters ?? ''}
                    onChange={(e) => updateSelected({ lengthMeters: Number(e.target.value) })}
                  />
                  <input
                    className="input"
                    list="cad-pipe-posa"
                    value={selectedEl.posa || ''}
                    onChange={(e) => updateSelected({ posa: e.target.value })}
                  />
                </div>
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