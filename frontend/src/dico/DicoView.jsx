import React, { useMemo, useRef, useState } from 'react';
import { TextField, TextArea } from '../components/Field';
import {
  DM37_LETTERS,
  INTERVENTION_TYPES,
  BUILDING_USES,
  COPY_TARGETS,
  NORM_PRESETS,
  DICO_TEMPLATES,
  createEmptyMaterialRow,
  syncMaterialsFromCad,
} from './dicoModel';
import { CadEditor } from './cad/CadEditor';
import { DicoPrintPreview } from './DicoPrintPreview';
import { clientLabel, clientSubLabel, makeId } from '../quote/quoteModel';
import { formatDate } from '../lib/format';

const TABS = [
  { id: 'form', label: '1. Allegato I & Fascicolo' },
  { id: 'cad', label: '2. Disegno CAD' },
  { id: 'materials', label: '3. Materiali' },
  { id: 'photos', label: '4. Foto' },
  { id: 'preview', label: '5. Anteprima & Stampa' },
];

export function DicoView({
  dicos,
  activeDico,
  onChangeDico,
  onSelectDico,
  onNewDico,
  onSaveDico,
  onDeleteDico,
  onPrintDico,
  clients,
  issuer,
}) {
  const [activeTab, setActiveTab] = useState('form');
  const [search, setSearch] = useState('');
  const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false);
  const [clientSuggestOpen, setClientSuggestOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const photoInputRef = useRef(null);

  const filteredDicos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dicos;
    return dicos.filter((d) =>
      [d.dico_number, d.client?.name, d.location?.address, d.location?.city, d.impianto_descrizione]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [dicos, search]);

  const clientSuggestions = useMemo(() => {
    const q = (activeDico.client?.name || '').trim().toLowerCase();
    const pool = clients.filter((c) => c.name);
    const matches = q
      ? pool.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.city || '').toLowerCase().includes(q) ||
            (c.address || '').toLowerCase().includes(q),
        )
      : pool;
    return matches.slice(0, 5);
  }, [activeDico.client?.name, clients]);

  const isSuggestOpen = clientSuggestOpen && clientSuggestions.length > 0;
  const rel = activeDico.relazione_schematica || {};
  const opts = activeDico.document_options || {
    include_cover: true,
    include_legenda: true,
    include_relazione_schematica: true,
    include_libretto: true,
    libretto_type: 'clima',
  };

  const updateField = (field, value) => {
    onChangeDico({ ...activeDico, [field]: value });
  };

  const updateNested = (section, field, value) => {
    onChangeDico({
      ...activeDico,
      [section]: { ...(activeDico[section] || {}), [field]: value },
    });
  };

  const toggleLetter = (code) => {
    const current = activeDico.letters || [];
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    updateField('letters', next);
  };

  const appendNorm = (normText) => {
    const current = (activeDico.norms || '').trim();
    if (current.includes(normText)) return;
    updateField('norms', current ? `${current}\n${normText}` : normText);
  };

  const applyTemplate = (template) => {
    if (
      (activeDico.drawing?.elements?.length || 0) > 0 &&
      !window.confirm(`Caricare il modello "${template.name}"? Sostituirà lo schema CAD e i materiali attuali.`)
    ) {
      return;
    }
    const built = template.build();
    onChangeDico({
      ...activeDico,
      ...built,
      attachments: {
        ...activeDico.attachments,
        relazione_materiali: true,
        schema_impianto: true,
      },
    });
    setShowTemplatesDrawer(false);
    setSaveNotice(`Modello "${template.name}" caricato`);
    window.setTimeout(() => setSaveNotice(''), 2500);
  };

  const applyClient = (clientData) => {
    onChangeDico({
      ...activeDico,
      client: { ...activeDico.client, ...clientData },
      location: {
        ...activeDico.location,
        address: activeDico.location.address || clientData.address || '',
        cap: activeDico.location.cap || clientData.cap || '',
        city: activeDico.location.city || clientData.city || '',
        province: activeDico.location.province || clientData.province || 'RM',
      },
    });
    setClientSuggestOpen(false);
  };

  const handleSave = async () => {
    setSaveNotice('Salvataggio…');
    await onSaveDico(activeDico);
    setSaveNotice('DiCo salvata');
    window.setTimeout(() => setSaveNotice(''), 2200);
  };

  const handleSyncCadMaterials = () => {
    const synced = syncMaterialsFromCad(activeDico.drawing, activeDico.materials);
    onChangeDico({
      ...activeDico,
      materials: synced,
      attachments: {
        ...activeDico.attachments,
        relazione_materiali: true,
        schema_impianto: true,
      },
    });
    setSaveNotice(`Materiali sincronizzati (${synced.length} voci)`);
    window.setTimeout(() => setSaveNotice(''), 2500);
  };

  const handleAddMaterial = () => {
    updateField('materials', [...(activeDico.materials || []), createEmptyMaterialRow()]);
  };

  const handleUpdateMaterial = (id, field, value) => {
    updateField(
      'materials',
      (activeDico.materials || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleRemoveMaterial = (id) => {
    updateField(
      'materials',
      (activeDico.materials || []).filter((row) => row.id !== id),
    );
  };

  const handleUploadPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 1000;
                const scale = Math.min(1, maxW / img.width);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({
                  id: makeId('ph'),
                  src: canvas.toDataURL('image/jpeg', 0.72),
                  caption: '',
                });
              };
              img.src = String(reader.result || '');
            };
            reader.readAsDataURL(file);
          }),
      ),
    ).then((newPhotos) => {
      onChangeDico({
        ...activeDico,
        photos: [...(activeDico.photos || []), ...newPhotos],
        attachments: { ...activeDico.attachments, relazione_fotografica: true },
      });
    });

    event.target.value = '';
  };

  return (
    <div className="dico-workspace">
      {/* BARRA SUPERIORE DI CONTROLLO */}
      <div className="panel dico-header-bar">
        <div className="row-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${showArchiveDrawer ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setShowArchiveDrawer((v) => !v);
                setShowTemplatesDrawer(false);
              }}
            >
              Archivio DiCo ({dicos.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${showTemplatesDrawer ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setShowTemplatesDrawer((v) => !v);
                setShowArchiveDrawer(false);
              }}
            >
              Modelli pronti
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onNewDico}>
              + Nuova DiCo
            </button>
            {saveNotice ? <span className="status-pill">{saveNotice}</span> : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleSave}>
              Salva DiCo
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                await onSaveDico(activeDico);
                onPrintDico();
              }}
            >
              Stampa / PDF Fascicolo
            </button>
          </div>
        </div>

        {/* DRAWER MODELLI PRONTI */}
        {showTemplatesDrawer ? (
          <div className="dico-archive-box">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Carica un modello completo (Norme + Schema CAD + Materiali + Libretto)
            </div>
            <div className="grid-3">
              {DICO_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="dico-tpl-card"
                  onClick={() => applyTemplate(tpl)}
                >
                  <strong>{tpl.name}</strong>
                  <small className="muted">{tpl.subtitle}</small>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* DRAWER ARCHIVIO */}
        {showArchiveDrawer ? (
          <div className="dico-archive-box">
            <input
              type="search"
              className="input"
              placeholder="Cerca DiCo per numero, cliente o indirizzo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            {filteredDicos.length === 0 ? (
              <div className="small muted">Nessuna DiCo salvata.</div>
            ) : (
              <div className="dico-archive-list">
                {filteredDicos.map((item) => (
                  <div
                    key={item.id}
                    className={`dico-archive-item ${item.id === activeDico.id ? 'is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="dico-archive-open"
                      onClick={() => {
                        onSelectDico(item);
                        setShowArchiveDrawer(false);
                      }}
                    >
                      <strong>DiCo N° {item.dico_number || '—'}</strong>
                      <span>{item.client?.name || 'Senza committente'}</span>
                      <small className="muted">
                        {formatDate(item.date)} · {item.location?.city || item.location?.address || '—'}
                      </small>
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => onDeleteDico(item.id)}
                      title="Elimina DiCo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* TAB NAVIGAZIONE */}
        <div className="dico-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dico-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'cad' && (activeDico.drawing?.elements?.length || 0) > 0 ? (
                <span className="nav-badge">{activeDico.drawing.elements.length}</span>
              ) : null}
              {tab.id === 'materials' && (activeDico.materials?.length || 0) > 0 ? (
                <span className="nav-badge">{activeDico.materials.length}</span>
              ) : null}
              {tab.id === 'photos' && (activeDico.photos?.length || 0) > 0 ? (
                <span className="nav-badge">{activeDico.photos.length}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== TAB 1: ALLEGATO I & FASCICOLO ==================== */}
      {activeTab === 'form' ? (
        <div className="stack-md">
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Impresa & Dichiarante</div>
                <h2 className="panel-title">Estremi DiCo, Titolare e Responsabile Tecnico</h2>
              </div>
            </div>

            <div className="grid-3">
              <TextField
                id="dico-num"
                label="Protocollo / N° DiCo"
                value={activeDico.dico_number}
                onChange={(v) => updateField('dico_number', v)}
                placeholder="Es. 2026-01"
              />
              <TextField
                id="dico-data"
                label="Data rilascio"
                type="date"
                value={activeDico.date}
                onChange={(v) => updateField('date', v)}
              />
              <div className="field">
                <label className="field-label" htmlFor="dico-copy-for">Copia destinata a</label>
                <select
                  id="dico-copy-for"
                  className="select"
                  value={activeDico.copy_for || 'Committente'}
                  onChange={(e) => updateField('copy_for', e.target.value)}
                >
                  {COPY_TARGETS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

<div className="grid-2" style={{ marginTop: 12 }}>
              <TextField
                id="dico-titolare"
                label="Titolare / Legale Rappresentante"
                value={activeDico.rt?.titolare || ''}
                onChange={(v) => updateNested('rt', 'titolare', v)}
                placeholder="Cristina Giacomozzi"
              />
              <TextField
                id="dico-rt"
                label="Responsabile Tecnico"
                value={activeDico.rt?.responsabile_tecnico || ''}
                onChange={(v) => updateNested('rt', 'responsabile_tecnico', v)}
                placeholder="Mario Pimpini"
              />
            </div>

            <div className="grid-3" style={{ marginTop: 12 }}>
              <TextField
                id="dico-cciaa-prov"
                label="CCIAA Provincia"
                value={activeDico.rt?.cciaa_provincia || ''}
                onChange={(v) => updateNested('rt', 'cciaa_provincia', v)}
                placeholder="Roma (RM)"
              />
              <TextField
                id="dico-cciaa-num"
                label="N° REA"
                value={activeDico.rt?.cciaa_numero || ''}
                onChange={(v) => updateNested('rt', 'cciaa_numero', v)}
                placeholder="1752188"
              />
              <TextField
                id="dico-albo"
                label="Albo Artigiani (opzionale)"
                value={activeDico.rt?.albo_artigiani || ''}
                onChange={(v) => updateNested('rt', 'albo_artigiani', v)}
                placeholder="Opzionale"
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">Committente & Immobile</div>
                <h2 className="panel-title">Destinatario e dati catastali</h2>
              </div>
            </div>

            <div className="grid-2">
              <div className="field suggest-wrap">
                <label className="field-label" htmlFor="dico-client-name">Committente</label>
                <input
                  id="dico-client-name"
                  className="input"
                  autoComplete="off"
                  value={activeDico.client?.name || ''}
                  placeholder="Es. Mario Rossi"
                  onChange={(e) => {
                    updateNested('client', 'name', e.target.value);
                    setClientSuggestOpen(true);
                  }}
                  onFocus={() => setClientSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setClientSuggestOpen(false), 130)}
                />
                {isSuggestOpen ? (
                  <div className="suggest" role="listbox">
                    {clientSuggestions.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        className="suggest-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyClient(c)}
                      >
                        {clientLabel(c)}
                        {clientSubLabel(c) ? <small>{clientSubLabel(c)}</small> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <TextField
                id="dico-client-tax"
                label="C.F. / P.IVA Committente"
                value={activeDico.client?.tax_id || ''}
                onChange={(v) => updateNested('client', 'tax_id', v)}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(activeDico.same_owner)}
                  onChange={(e) => updateField('same_owner', e.target.checked)}
                />
                Il proprietario coincide con il committente
              </label>
            </div>

            {!activeDico.same_owner ? (
              <div className="grid-2" style={{ marginTop: 10 }}>
                <TextField id="dico-own-n" label="Proprietario" value={activeDico.owner_name || ''} onChange={(v) => updateField('owner_name', v)} />
                <TextField id="dico-own-a" label="Indirizzo proprietario" value={activeDico.owner_address || ''} onChange={(v) => updateField('owner_address', v)} />
              </div>
            ) : null}

            <div className="grid-3" style={{ marginTop: 12 }}>
              <TextField id="dico-loc-addr" label="Via / Piazza" value={activeDico.location?.address || ''} onChange={(v) => updateNested('location', 'address', v)} />
              <TextField id="dico-loc-civ" label="Civico" value={activeDico.location?.civico || ''} onChange={(v) => updateNested('location', 'civico', v)} />
              <TextField id="dico-loc-city" label="Comune" value={activeDico.location?.city || ''} onChange={(v) => updateNested('location', 'city', v)} />
            </div>

            <div className="grid-3" style={{ marginTop: 12 }}>
              <TextField id="dico-loc-scala" label="Scala" value={activeDico.location?.scala || ''} onChange={(v) => updateNested('location', 'scala', v)} />
              <TextField id="dico-loc-piano" label="Piano" value={activeDico.location?.piano || ''} onChange={(v) => updateNested('location', 'piano', v)} />
              <TextField id="dico-loc-int" label="Interno" value={activeDico.location?.interno || ''} onChange={(v) => updateNested('location', 'interno', v)} />
            </div>

            <div className="grid-3" style={{ marginTop: 12 }}>
              <TextField id="dico-fg" label="Catasto: Sezione / Foglio" value={activeDico.location?.foglio || ''} onChange={(v) => updateNested('location', 'foglio', v)} />
              <TextField id="dico-part" label="Particella" value={activeDico.location?.particella || ''} onChange={(v) => updateNested('location', 'particella', v)} />
              <TextField id="dico-sub" label="Subalterno" value={activeDico.location?.subalterno || ''} onChange={(v) => updateNested('location', 'subalterno', v)} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">D.M. 37/08</div>
                <h2 className="panel-title">Impianto, Norme e Sezioni del Fascicolo</h2>
              </div>
            </div>

            <TextArea
              label="Descrizione schematica dell’impianto"
              value={activeDico.impianto_descrizione || ''}
              onChange={(v) => updateField('impianto_descrizione', v)}
              rows={2}
              placeholder="Es. Nuovo impianto di condizionamento in civile abitazione."
            />

            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="field">
                <span className="field-label">Tipo intervento & Destinazione</span>
                <div className="chip-row" style={{ marginTop: 4 }}>
                  {INTERVENTION_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`chip ${activeDico.intervention_type === t.id ? 'is-chip-selected' : ''}`}
                      onClick={() => updateField('intervention_type', t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="chip-row" style={{ marginTop: 8 }}>
                  {BUILDING_USES.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`chip ${activeDico.building_use === u.id ? 'is-chip-selected' : ''}`}
                      onClick={() => updateField('building_use', u.id)}
                    >
                      Uso: {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field-label">Lettere D.M. 37/08</span>
                <div className="stack-sm" style={{ gap: 5, marginTop: 4 }}>
                  {DM37_LETTERS.map((l) => (
                    <label key={l.code} className="check">
                      <input
                        type="checkbox"
                        checked={(activeDico.letters || []).includes(l.code)}
                        onChange={() => toggleLetter(l.code)}
                      />
                      <span>{l.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <TextArea
                label="Norme tecniche seguite"
                value={activeDico.norms || ''}
                onChange={(v) => updateField('norms', v)}
                rows={2}
              />
              <div className="chip-row" style={{ marginTop: 8 }}>
                {NORM_PRESETS.map((n) => (
                  <button key={n} type="button" className="chip" onClick={() => appendNorm(n)}>
                    + {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Opzioni Fascicolo Stampa (stile mrDico) */}
            <div className="dico-options-box">
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Composizione del Fascicolo PDF
              </div>
              <div className="grid-2">
                <div className="stack-sm" style={{ gap: 7 }}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(opts.include_cover)}
                      onChange={(e) => updateNested('document_options', 'include_cover', e.target.checked)}
                    />
                    Includi Copertina formale del fascicolo
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(opts.include_legenda)}
                      onChange={(e) => updateNested('document_options', 'include_legenda', e.target.checked)}
                    />
                    Includi Pagina 2 — Legenda ministeriale (note 1–10)
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(opts.include_relazione_schematica)}
                      onChange={(e) =>
                        updateNested('document_options', 'include_relazione_schematica', e.target.checked)
                      }
                    />
                    Includi Sez. I & II — Relazione schematica
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(opts.include_libretto)}
                      onChange={(e) => updateNested('document_options', 'include_libretto', e.target.checked)}
                    />
                    Allega Libretto d’Uso e Manutenzione + Ricevuta
                  </label>
                </div>

                <div className="stack-sm">
                  {opts.include_libretto ? (
                    <div className="field">
                      <label className="field-label" htmlFor="dico-lib-type">Tipologia Libretto Uso e Manutenzione</label>
                      <select
                        id="dico-lib-type"
                        className="select"
                        value={opts.libretto_type || 'clima'}
                        onChange={(e) => updateNested('document_options', 'libretto_type', e.target.value)}
                      >
                        <option value="clima">Climatizzazione ad espansione diretta (F-Gas)</option>
                        <option value="termico">Impianto termico / Caldaia (DPR 74/2013)</option>
                        <option value="idrico_gas">Impianto Idrico-Sanitario / Gas</option>
                      </select>
                    </div>
                  ) : null}

                  <TextField
                    id="dico-rel-altro"
                    label="Nota Relazione Schematica (Sez. II)"
                    value={rel.altro_testo || ''}
                    onChange={(v) => updateNested('relazione_schematica', 'altro_testo', v)}
                    placeholder="Es. Installazione ed allacciamento di Split ed Unità Esterna."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ==================== TAB 2: DISEGNO CAD ==================== */}
      {activeTab === 'cad' ? (
        <div className="panel">
          <CadEditor
            drawing={activeDico.drawing}
            onChangeDrawing={(nextDrawing) => updateField('drawing', nextDrawing)}
            onSyncMaterials={handleSyncCadMaterials}
          />
        </div>
      ) : null}

      {/* ==================== TAB 3: MATERIALI (10 COLONNE) ==================== */}
      {activeTab === 'materials' ? (
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Sez. III — Quadro B</div>
              <h2 className="panel-title">Tipologia dei prodotti impiegati</h2>
              <p className="panel-sub">
                Ogni sigla (P1, P2, P4…) corrisponde al disegno CAD. Completa Costruttore e Matricola dove necessario.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSyncCadMaterials}>
                Importa dal CAD
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddMaterial}>
                + Aggiungi riga
              </button>
            </div>
          </div>

          {(activeDico.materials || []).length === 0 ? (
            <div className="cal-day-empty">
              Nessun materiale inserito. Carica un modello pronto o disegna nel CAD e premi “Importa dal CAD”.
            </div>
          ) : (
            <div className="stack-sm">
              {activeDico.materials.map((row) => (
                <div key={row.id} className="dico-mat-row">
                  <div className="dico-mat-row-top">
                    <input
                      className="input"
                      placeholder="Ubicazione (es. Mansarda)"
                      value={row.location || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'location', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Rif. (P1)"
                      value={row.code || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'code', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Componente"
                      value={row.description || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'description', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Costruttore / Marca"
                      value={row.brand || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'brand', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Matricola"
                      value={row.serial || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'serial', e.target.value)}
                    />
                  </div>
                  <div className="dico-mat-row-bottom">
                    <input
                      className="input"
                      placeholder="Materiale"
                      value={row.material || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'material', e.target.value)}
                    />
                    <input
                      className="input amount-input"
                      placeholder="Q.tà"
                      value={row.qty || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'qty', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Diametro"
                      value={row.dimension || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'dimension', e.target.value)}
                    />
                    <input
                      className="input amount-input"
                      placeholder="Lungh. (m)"
                      value={row.length || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'length', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Installazione"
                      value={row.posa || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'posa', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Attestati / CE"
                      value={row.norm || ''}
                      onChange={(e) => handleUpdateMaterial(row.id, 'norm', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => handleRemoveMaterial(row.id)}
                      title="Elimina riga"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ==================== TAB 4: RELAZIONE FOTOGRAFICA ==================== */}
      {activeTab === 'photos' ? (
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Allegato Facoltativo</div>
              <h2 className="panel-title">Relazione Fotografica</h2>
            </div>
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleUploadPhotos}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => photoInputRef.current?.click()}
              >
                + Carica foto
              </button>
            </div>
          </div>

          {(activeDico.photos || []).length === 0 ? (
            <div className="cal-day-empty">
              Nessuna foto caricata.
            </div>
          ) : (
            <div className="dico-photos-grid">
              {activeDico.photos.map((photo, index) => (
                <div key={photo.id} className="dico-photo-card">
                  <img src={photo.src} alt={photo.caption || `Foto ${index + 1}`} />
                  <input
                    className="input"
                    placeholder={`Didascalia Foto ${index + 1}`}
                    value={photo.caption}
                    onChange={(e) =>
                      updateField(
                        'photos',
                        activeDico.photos.map((p) =>
                          p.id === photo.id ? { ...p, caption: e.target.value } : p,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() =>
                      updateField(
                        'photos',
                        activeDico.photos.filter((p) => p.id !== photo.id),
                      )
                    }
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ==================== TAB 5: ANTEPRIMA & STAMPA ==================== */}
      {activeTab === 'preview' ? (
        <div className="doc-frame">
          <DicoPrintPreview dico={activeDico} issuer={issuer} />
        </div>
      ) : null}
    </div>
  );
}