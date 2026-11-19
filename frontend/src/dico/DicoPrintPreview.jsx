import React, { useMemo } from 'react';
import { formatDate } from '../lib/format';
import { DM37_LETTERS, INTERVENTION_TYPES, BUILDING_USES } from './dicoModel';
import { CadSvgRenderer } from './cad/CadEditor';
import { CAD_SYMBOLS, PIPE_TYPES, renderSymbolGlyph } from './cad/symbols';
import logoUrl from '../assets/logo.png';

const Box = ({ checked }) => (
  <span className={`dico-check-box ${checked ? 'is-checked' : ''}`}>
    {checked ? '✕' : ''}
  </span>
);

const LIBRETTO_CONTROLS = {
  clima: [
    ['Controllo visivo', ['Idoneità area di installazione e fissaggi', 'Corrette distanze tra apparecchi ed ostacoli', 'Stato zone di raccolta condensa e ossidazione scocca', 'Integrità linee frigorifere e isolamenti']],
    ['Controllo funzionale', ['Controllo vibrazioni e rumorosità', 'Verifica serraggio contatti elettrici e messa a terra', 'Verifica ventilatori, alette direzionali e comandi', 'Corretta accensione, spegnimento e inversione ciclo']],
    ['Controllo strumentale e igienico', ['Controllo temperature e pressioni di esercizio', 'Verifica efficienza scarico condensa', 'Verifica assenza perdite refrigerante / olio', 'Pulizia e sanificazione filtri ed evaporatore']],
  ],
  termico: [
    ['Controllo visivo e sicurezza', ['Idoneità locale, ventilazione e aerazione (UNI 7129)', 'Integrità condotto fumi e tiraggio', 'Stato valvole di intercettazione e sicurezza']],
    ['Controllo funzionale e combustione', ['Analisi combustione e rendimento (DPR 74/2013)', 'Verifica pressione vaso di espansione e circuito', 'Verifica tenuta linea gas e assenza perdite']],
    ['Manutenzione periodica', ['Pulizia scambiatore primario e bruciatore', 'Pulizia sifone scarico condensa e defangatore', 'Verifica dispositivi di regolazione e termostato']],
  ],
  idrico_gas: [
    ['Controllo rete idrica', ['Verifica tenuta idraulica e assenza trafilamenti', 'Controllo pressione di esercizio e riduttore', 'Efficienza valvole di intercettazione su collettori']],
    ['Controllo scarichi e sicurezza', ['Deflusso regolare pilette, sifoni e colonna', 'Stato guarnizioni flessibili e rubinetteria', 'Controllo eventuale adduzione gas e raccordi']],
  ],
};

export function DicoPrintPreview({ dico, issuer }) {
  const rt = dico.rt || {};
  const loc = dico.location || {};
  const att = dico.attachments || {};
  const rel = dico.relazione_schematica || {};
  const opts = dico.document_options || {
    include_cover: true,
    include_legenda: true,
    include_relazione_schematica: true,
    include_libretto: true,
    libretto_type: 'clima',
  };
  const elements = dico.drawing?.elements || [];

  const usedPipeTypes = useMemo(() => {
    const ids = new Set(elements.filter((e) => e.kind === 'pipe').map((e) => e.pipeType));
    return [...ids].map((id) => PIPE_TYPES[id]).filter(Boolean);
  }, [elements]);

  const usedSymbolTypes = useMemo(() => {
    const ids = new Set(
      elements
        .filter((e) => e.kind === 'symbol' && !CAD_SYMBOLS[e.symbolType]?.isArchitectural)
        .map((e) => e.symbolType),
    );
    return [...ids].map((id) => CAD_SYMBOLS[id]).filter(Boolean);
  }, [elements]);

  const locationLine = [
    loc.address,
    loc.civico ? `n° ${loc.civico}` : '',
    loc.cap,
    loc.city,
    loc.province ? `(${loc.province})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const lettersText = DM37_LETTERS.filter((l) => (dico.letters || []).includes(l.code))
    .map((l) => l.code.toUpperCase())
    .join(', ');

  const companyName = issuer?.name || 'CRI.MA. IMPIANTI S.R.L.';
  const ownerDisplay = dico.same_owner
    ? `${dico.client?.name || '—'}${dico.client?.address ? ` — ${dico.client.address}` : ''}`
    : `${dico.owner_name || '—'}${dico.owner_address ? ` — ${dico.owner_address}` : ''}`;

  const librettoTitle =
    opts.libretto_type === 'termico'
      ? 'IMPIANTO TERMICO E CLIMATIZZAZIONE INVERNALE'
      : opts.libretto_type === 'idrico_gas'
        ? 'IMPIANTO IDRICO-SANITARIO E ADDUZIONE GAS'
        : 'IMPIANTO DI CLIMATIZZAZIONE AD ESPANSIONE DIRETTA';

  const PageFooter = ({ label }) => (
    <div className="dico-page-footer">
      <span>
        {companyName} · P.IVA {issuer?.vat || '—'} · Tel. {issuer?.phone || '—'}
      </span>
      <span>
        Copia per: <strong>{dico.copy_for || 'Committente'}</strong> · {label}
      </span>
    </div>
  );

  return (
    <div className="dico-doc" id="documento-dico">
      {/* ==================== COPERTINA FASCICOLO ==================== */}
      {opts.include_cover ? (
        <section className="dico-page dico-cover-page">
          <div className="dico-cover-topbar">
            <span>{companyName}</span>
            <span>Dichiarazione di Conformità N° <strong>{dico.dico_number || '—'}</strong></span>
          </div>

          <div className="dico-cover-logo-area">
            <img
              src={logoUrl}
              alt="Logo aziendale"
              className="dico-cover-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <div className="dico-cover-box">
            <div className="dico-cover-title">
              DICHIARAZIONE DI CONFORMITÀ
              <br />
              DELL’IMPIANTO ALLA REGOLA DELL’ARTE
            </div>
            <div className="dico-cover-law">
              Art. 7 Decreto 22 gennaio 2008, n. 37 e D.M. 19 maggio 2010
            </div>

            <div className="dico-cover-section">
              <div className="dico-cover-label">Rilasciata da:</div>
              <div className="dico-cover-value-lg">{companyName}</div>
            </div>

            <div className="dico-cover-section">
              <div className="dico-cover-label">Relativa all’impianto installato nei locali siti in:</div>
              <div className="dico-cover-grid">
                <div><strong>Via:</strong> {loc.address || '—'}</div>
                <div><strong>N°:</strong> {loc.civico || '—'}</div>
                <div><strong>Comune:</strong> {loc.city || '—'}</div>
                <div><strong>Provincia:</strong> {loc.province || '—'}</div>
                <div><strong>Scala:</strong> {loc.scala || '—'}</div>
                <div><strong>Piano / Int.:</strong> {[loc.piano, loc.interno].filter(Boolean).join(' / ') || '—'}</div>
                <div><strong>Sezione / Foglio:</strong> {[loc.sezione, loc.foglio].filter(Boolean).join(' / ') || '—'}</div>
                <div><strong>Particella / Sub.:</strong> {[loc.particella, loc.subalterno].filter(Boolean).join(' / ') || '—'}</div>
              </div>
            </div>

            <div className="dico-cover-section">
              <div className="dico-cover-row">
                <span><strong>Proprietario:</strong> {ownerDisplay}</span>
              </div>
              <div className="dico-cover-row">
                <span><strong>Committente:</strong> {dico.client?.name || '—'}</span>
              </div>
              <div className="dico-cover-row">
                <span><strong>Descrizione:</strong> {dico.impianto_descrizione || '—'}</span>
              </div>
              <div className="dico-cover-row">
                <span><strong>Lettere D.M. 37/08:</strong> {lettersText || '—'} · <strong>Data:</strong> {formatDate(dico.date) || '—'}</span>
              </div>
            </div>
          </div>

          <div className="dico-cover-company-card">
            <div className="dico-cover-company-name">{companyName}</div>
            <div>{issuer?.address}</div>
            <div>P.IVA / C.F.: <strong>{issuer?.vat || '—'}</strong></div>
            <div>Telefono: {issuer?.phone || '—'} · Email: {issuer?.email || '—'}</div>
          </div>

          <PageFooter label="Copertina" />
        </section>
      ) : null}

      {/* ==================== ALLEGATO I (PAGINA 1) ==================== */}
      <section className={`dico-page ${opts.include_cover ? 'dico-page-break' : ''}`}>
        <div className="dico-min-top">
          <div className="dico-min-brand">
            <img
              src={logoUrl}
              alt="Logo"
              className="dico-min-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div className="dico-min-company">{companyName}</div>
              <div className="dico-min-sub">
                {issuer?.address} {issuer?.vat ? `· P.IVA ${issuer.vat}` : ''}
              </div>
              <div className="dico-min-sub">
                {[issuer?.phone, issuer?.email].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          <div className="dico-min-badge">
            <div>ALLEGATO I (di cui all’Art. 7)</div>
            <strong>Prot. N° {dico.dico_number || '—'}</strong>
            <div>Data: {formatDate(dico.date) || '—'}</div>
          </div>
        </div>

        <h1 className="dico-legal-title">
          DICHIARAZIONE DI CONFORMITÀ DELL’IMPIANTO ALLA REGOLA DELL’ARTE
        </h1>
        <p className="dico-legal-sub">
          Decreto 22 gennaio 2008, n. 37 e D.M. del 19 maggio 2010
        </p>

        <div className="dico-legal-body">
          <p>
            Il Sottoscritto <strong>{rt.titolare || rt.responsabile_tecnico || '______________________'}</strong>{' '}
            titolare o legale rappresentante dell’impresa <strong>{companyName}</strong> operante nel
            settore <strong>impiantistico (D.M. 37/08 lett. {lettersText || '___'})</strong> con sede in{' '}
            <strong>{issuer?.address || '______________________'}</strong>, tel.{' '}
            <strong>{issuer?.phone || '__________'}</strong>, Part. IVA{' '}
            <strong>{issuer?.vat || '____________'}</strong>,
          </p>

          <div className="dico-check-row">
            <span className="dico-check-item">
              <Box checked={Boolean(rt.cciaa_numero)} />
              iscritta nel registro delle imprese (DPR 7/12/1995, n. 581) della C.C.I.A.A. di{' '}
              <strong>{rt.cciaa_provincia || '______'}</strong> n. <strong>{rt.cciaa_numero || '________'}</strong>
            </span>
            <span className="dico-check-item">
              <Box checked={Boolean(rt.albo_artigiani)} />
              Albo Provinciale Imprese Artigiane (L. 443/85) n. <strong>{rt.albo_artigiani || '____'}</strong>
            </span>
          </div>

          <p>
            <strong>esecutrice dell’impianto</strong> (descrizione schematica):{' '}
            <strong>{dico.impianto_descrizione || '__________________________________________________'}</strong>
          </p>

          <div className="dico-check-row">
            <strong>inteso come:</strong>
            {INTERVENTION_TYPES.map((t) => (
              <span key={t.id} className="dico-check-item">
                <Box checked={dico.intervention_type === t.id} />
                {t.label}
                {t.id === 'altro' && dico.intervention_other ? `: ${dico.intervention_other}` : ''}
              </span>
            ))}
          </div>

          <p>
            <strong>Commissionato da:</strong> <strong>{dico.client?.name || '______________________'}</strong>
            {dico.client?.tax_id ? ` (C.F./P.IVA ${dico.client.tax_id})` : ''}{' '}
            — <strong>installato nei locali siti in:</strong> <strong>{locationLine || '______________________'}</strong>
            {[
              loc.scala ? `Scala ${loc.scala}` : '',
              loc.piano ? `Piano ${loc.piano}` : '',
              loc.interno ? `Int. ${loc.interno}` : '',
              loc.sezione ? `Sez. ${loc.sezione}` : '',
              loc.foglio ? `Fg. ${loc.foglio}` : '',
              loc.particella ? `Part. ${loc.particella}` : '',
              loc.subalterno ? `Sub. ${loc.subalterno}` : '',
            ].filter(Boolean).length > 0
              ? ` (${[
                  loc.scala ? `Sc. ${loc.scala}` : '',
                  loc.piano ? `P. ${loc.piano}` : '',
                  loc.interno ? `Int. ${loc.interno}` : '',
                  loc.sezione ? `Sez. ${loc.sezione}` : '',
                  loc.foglio ? `Fg. ${loc.foglio}` : '',
                  loc.particella ? `Part. ${loc.particella}` : '',
                  loc.subalterno ? `Sub. ${loc.subalterno}` : '',
                ]
                  .filter(Boolean)
                  .join(', ')})`
              : ''}
            <br />
            <strong>di proprietà di:</strong> <strong>{ownerDisplay}</strong>
          </p>

          <div className="dico-check-row">
            <strong>in edificio adibito ad uso:</strong>
            {BUILDING_USES.map((u) => (
              <span key={u.id} className="dico-check-item">
                <Box checked={dico.building_use === u.id} />
                {u.label}
              </span>
            ))}
          </div>

          <h2 className="dico-section-h">DICHIARA</h2>
          <p>
            sotto la propria personale responsabilità, che l’impianto è stato realizzato in modo
            conforme alla regola dell’arte, secondo quanto previsto dall’art. 6, tenuto conto delle
            condizioni di esercizio e degli usi a cui è destinato l’edificio, avendo in particolare:
          </p>

          <ul className="dico-decl-list">
            <li>
              <Box checked={Boolean(dico.project_respected)} />
              rispettato il progetto redatto ai sensi dell’art. 5 da (2):{' '}
              <strong>
                {dico.project_respected
                  ? dico.project_author || '________________'
                  : rt.responsabile_tecnico
                    ? `Resp. Tecn.: ${rt.responsabile_tecnico}`
                    : '—'}
              </strong>
            </li>
            <li>
              <Box checked={Boolean((dico.norms || '').trim())} />
              seguito la norma tecnica applicabile all’impiego (3):{' '}
              <strong>{(dico.norms || '').replace(/\n+/g, '; ') || '________________'}</strong>
            </li>
            <li>
              <Box checked />
              installato componenti e materiali adatti al luogo di installazione (artt. 5 e 6);
            </li>
            <li>
              <Box checked />
              controllato l’impianto ai fini della sicurezza e della funzionalità con esito positivo,
              avendo eseguito le verifiche richieste dalle norme e dalle disposizioni di legge.
            </li>
          </ul>

          <h2 className="dico-section-h">ALLEGATI OBBLIGATORI</h2>
          <div className="dico-att-grid">
            <div className="dico-check-item"><Box checked={Boolean(att.progetto)} /> progetto ai sensi degli articoli 5 e 7 (4);</div>
            <div className="dico-check-item"><Box checked={Boolean(att.relazione_materiali)} /> relazione con tipologie dei materiali utilizzati (5);</div>
            <div className="dico-check-item"><Box checked={Boolean(att.schema_impianto)} /> schema di impianto realizzato (6);</div>
            <div className="dico-check-item"><Box checked={Boolean(att.riferimento_dico_precedenti)} /> riferimento a DiCo precedenti o parziali (7);</div>
            <div className="dico-check-item"><Box checked={Boolean(att.visura_camerale)} /> copia del certificato requisiti tecnico-professionali;</div>
            <div className="dico-check-item"><Box checked={Boolean(att.attestazione_non_normalizzati)} /> attestazione materiali/sistemi non normalizzati (8).</div>
          </div>

          <p style={{ marginTop: 4 }}>
            <strong>Allegati facoltativi (9):</strong>{' '}
            {[
              opts.include_libretto ? 'Libretto d’Uso e Manutenzione' : '',
              att.relazione_fotografica ? 'Relazione fotografica' : '',
              att.altri_allegati,
            ]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>

          <h2 className="dico-section-h">DECLINA</h2>
          <p>
            ogni responsabilità per sinistri a persone o a cose derivanti da manomissione
            dell’impianto da parte di terzi ovvero da carenze di manutenzione o riparazione.
          </p>

          <div className="dico-signatures-4">
            <div>
              <div>Data</div>
              <strong>{formatDate(dico.date) || '____/____/________'}</strong>
            </div>
            <div className="dico-sign-box">
              <div>Il Responsabile Tecnico</div>
              <div className="dico-sign-line">{rt.responsabile_tecnico || '(timbro e firma)'}</div>
            </div>
            <div className="dico-sign-box">
              <div>Il Dichiarante</div>
              <div className="dico-sign-line">{rt.titolare || '(timbro e firma)'}</div>
            </div>
            <div className="dico-sign-box">
              <div>Il Cliente</div>
              <div className="dico-sign-line">(firma per ricevuta)</div>
            </div>
          </div>

          <div className="dico-art8-box">
            <strong>AVVERTENZE PER IL COMMITTENTE — responsabilità del committente o del proprietario, art. 8 (10):</strong>{' '}
            Il committente o il proprietario è tenuto ad affidare i lavori di installazione, di trasformazione, di
            ampliamento e di manutenzione degli impianti di cui all’art. 1 ad imprese abilitate ai sensi dell’art. 3.
          </div>
        </div>

        <PageFooter label="Allegato I — Pag. 1" />
      </section>

      {/* ==================== LEGENDA MINISTERIALE (PAGINA 2) ==================== */}
      {opts.include_legenda ? (
        <section className="dico-page dico-page-break">
          <div className="dico-sub-header">
            <strong>ALLEGATO I — LEGENDA NOTE ESPLICATIVE</strong>
            <span className="dico-min-sub">Prot. N° {dico.dico_number || '—'}</span>
          </div>
          <ol className="dico-legenda-list">
            <li>Come esempio nel caso di impianti a gas, con “altro” si può intendere la sostituzione di un apparecchio installato in modo fisso.</li>
            <li>Indicare: nome, cognome, qualifica e, quando ne ricorra l’obbligo ai sensi dell’art. 5, comma 2, estremi di iscrizione nel relativo Albo professionale, del tecnico che ha redatto il progetto.</li>
            <li>Citare la o le norme tecniche e di legge, distinguendo tra quelle riferite alla progettazione, all’esecuzione e alle verifiche.</li>
            <li>Qualora l’impianto eseguito su progetto sia variato in opera, il progetto presentato alla fine dei lavori deve comprendere le varianti realizzate in corso d’opera. Fa parte del progetto la citazione della pratica prevenzione incendi (ove richiesta).</li>
            <li>La relazione deve contenere, per i prodotti soggetti a norme, la dichiarazione di rispondenza alle stesse completata, ove esistente, con riferimenti a marchi, certificati di prova, ecc. rilasciati da istituti autorizzati. Per gli altri prodotti il firmatario deve dichiarare che trattasi di materiali conformi agli artt. 5 e 6 e idonei all’ambiente di installazione.</li>
            <li>Per schema dell’impianto realizzato si intende la descrizione dell’opera come eseguita (si fa semplice rinvio al progetto quando questo è stato redatto da un professionista abilitato e non sono state apportate varianti in corso d’opera).</li>
            <li>I riferimenti sono costituiti dal nome dell’impresa esecutrice e dalla data della dichiarazione. Per gli impianti anteriori al decreto il riferimento può essere sostituito dalla Dichiarazione di Rispondenza (art. 7, comma 6).</li>
            <li>Se nell’impianto risultano incorporati prodotti o sistemi legittimamente utilizzati in altro Stato UE/SEE privi di norme tecniche, la DiCo deve essere corredata dal progetto di un ingegnere iscritto all’albo con analisi dei rischi.</li>
            <li>Esempio: eventuali certificati dei risultati delle verifiche eseguite prima della messa in esercizio, libretti d’uso e manutenzione o trattamenti di pulizia/sanificazione.</li>
            <li>Al termine dei lavori l’impresa installatrice è tenuta a rilasciare al committente la dichiarazione di conformità ai sensi dell’art. 7. Il committente è tenuto ad affidare i lavori esclusivamente ad imprese abilitate ai sensi dell’art. 3.</li>
          </ol>
          <PageFooter label="Legenda Allegato I" />
        </section>
      ) : null}

      {/* ==================== ALLEGATI OBBLIGATORI SEZ. I & II ==================== */}
      {opts.include_relazione_schematica ? (
        <section className="dico-page dico-page-break">
          <div className="dico-sub-header">
            <div>
              <strong>ALLEGATI OBBLIGATORI — SEZ. I & II (RELAZIONE SCHEMATICA)</strong>
              <div className="dico-min-sub">Decreto 22 gennaio 2008, n. 37 e D.M. 19 maggio 2010</div>
            </div>
            <strong>Prot. N° {dico.dico_number || '—'}</strong>
          </div>

          <div className="dico-quadro-box">
            <div className="dico-quadro-grid">
              <div><strong>Impresa / Ditta:</strong> {companyName}</div>
              <div><strong>Mod. “Allegato I” del:</strong> {formatDate(dico.date) || '—'}</div>
              <div><strong>Titolare:</strong> {rt.titolare || '—'}</div>
              <div><strong>Dichiarazione N°:</strong> {dico.dico_number || '—'}</div>
              <div><strong>Responsabile Tecnico:</strong> {rt.responsabile_tecnico || '—'}</div>
              <div><strong>Committente:</strong> {dico.client?.name || '—'}</div>
              {rel.pdr ? <div><strong>Punto di riconsegna PDR:</strong> {rel.pdr}</div> : null}
            </div>
          </div>

          <h3 className="dico-quadro-title">Sez. I — Riferimenti inerenti alla documentazione</h3>
          <div className="dico-quadro-box">
            <div className="dico-att-grid">
              <div className="dico-check-item"><Box checked={Boolean(att.progetto)} /> Progetto impianto / rif.: {dico.project_author || '—'}</div>
              <div className="dico-check-item"><Box checked={Boolean(att.riferimento_dico_precedenti)} /> Dichiarazioni precedenti: {dico.previous_dico_ref || '—'}</div>
            </div>
          </div>

          <h3 className="dico-quadro-title">Sez. II — Relazione schematica dell’intervento</h3>
          <div className="dico-quadro-box">
            <div className="dico-scenario-grid">
              <div>
                <div className="dico-plate-label">SCENARIO A — NATURA INTERVENTO</div>
                <div className="stack-sm" style={{ gap: 5 }}>
                  <div className="dico-check-item"><Box checked={Boolean(rel.nuovo_impianto)} /> Nuovo impianto</div>
                  <div className="dico-check-item"><Box checked={Boolean(rel.modifica_esistente)} /> Modifica / Rifacimento impianto esistente</div>
                  <div className="dico-check-item"><Box checked={Boolean(rel.installazione_apparecchi)} /> Installazione / allacciamento apparecchi</div>
                  <div className="dico-check-item"><Box checked={Boolean(rel.installazione_tubazione)} /> Installazione tratti di tubazione</div>
                  <div className="dico-check-item"><Box checked={Boolean(rel.collegamento_canna_fumaria)} /> Collegamento apparecchi a canna fumaria</div>
                  <div className="dico-check-item"><Box checked={Boolean(rel.aperture_ventilazione)} /> Realizzazione aperture di ventilazione</div>
                  <div className="dico-check-item"><Box checked={Boolean(rel.aperture_aerazione)} /> Realizzazione aperture di aerazione</div>
                </div>
              </div>

              <div>
                <div className="dico-plate-label">SCENARIO B & C — DIMENSIONAMENTO</div>
                <div className="stack-sm" style={{ gap: 6 }}>
                  <div className="dico-check-item">
                    <Box checked={Boolean(rel.potenza_kw)} />
                    Potenza termica / frigorifera collegata: <strong>{rel.potenza_kw || '—'} kW</strong>
                  </div>
                  <div className="dico-check-item">
                    <Box checked={Boolean(rel.esecuzione_progetto)} />
                    Esecuzione effettuata in conformità di un progetto
                  </div>
                  <div className="dico-check-item">
                    <Box checked={Boolean(rel.esecuzione_installatore)} />
                    Esecuzione e dimensionamento a cura dell’Installatore
                  </div>
                  {rel.altro_testo ? (
                    <div style={{ marginTop: 6 }}>
                      <strong>Dettaglio lavori:</strong> {rel.altro_testo}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <PageFooter label="Relazione Schematica" />
        </section>
      ) : null}

      {/* ==================== SEZ. III: TIPOLOGIA MATERIALI (10 COLONNE) ==================== */}
      {att.relazione_materiali && (dico.materials || []).length > 0 ? (
        <section className="dico-page dico-page-break">
          <div className="dico-sub-header">
            <div>
              <strong>ALLEGATI OBBLIGATORI — SEZ. III: TIPOLOGIA DEI PRODOTTI IMPIEGATI</strong>
              <div className="dico-min-sub">
                Quadro B: Materiali e componenti utilizzati · DiCo N° {dico.dico_number || '—'} del {formatDate(dico.date) || '—'}
              </div>
            </div>
            <strong>Prot. N° {dico.dico_number || '—'}</strong>
          </div>

          <p className="dico-legal-sub" style={{ textAlign: 'left', marginBottom: 8 }}>
            Dichiaro che i materiali, le tubazioni, le giunzioni, i raccordi ed i pezzi speciali utilizzati
            sono previsti dalle norme di installazione applicabili: <strong>{(dico.norms || '').replace(/\n+/g, '; ') || 'Norme UNI / CEI vigenti'}</strong>.
          </p>

          <table className="dico-mat-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Ubicazione</th>
                <th style={{ width: '6%' }}>Rif.</th>
                <th style={{ width: '21%' }}>Componente</th>
                <th style={{ width: '11%' }}>Costruttore</th>
                <th style={{ width: '9%' }}>Matricola</th>
                <th style={{ width: '9%' }}>Materiale</th>
                <th style={{ width: '5%' }}>Q.tà</th>
                <th style={{ width: '7%' }}>Diametro</th>
                <th style={{ width: '7%' }}>Lungh. (m)</th>
                <th style={{ width: '8%' }}>Installaz.</th>
                <th style={{ width: '7%' }}>Attestati / CE</th>
              </tr>
            </thead>
            <tbody>
              {dico.materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.location || '—'}</td>
                  <td style={{ color: '#991b1b', fontWeight: 700 }}>{m.code || '—'}</td>
                  <td>{m.description || '—'}</td>
                  <td>{m.brand || '—'}</td>
                  <td>{m.serial || '—'}</td>
                  <td>{m.material || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{m.qty || '1'}</td>
                  <td>{m.dimension || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{m.length || '—'}</td>
                  <td>{m.posa || '—'}</td>
                  <td>{m.norm || 'CE'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: 10, fontSize: '8.2pt' }}>
            Dichiaro che i materiali sono conformi a quanto previsto dagli artt. 5 e 6 del Decreto
            22/01/2008 n. 37 in materia di regola dell’arte e compatibili con gli ambienti di installazione.
          </p>

          {dico.notes?.trim() ? (
            <p style={{ marginTop: 4, fontSize: '8.2pt' }}>
              <strong>Note:</strong> {dico.notes}
            </p>
          ) : null}

          <PageFooter label="Sez. III — Materiali" />
        </section>
      ) : null}

      {/* ==================== TAVOLA SCHEMA DEGLI IMPIANTI (CAD) ==================== */}
      {att.schema_impianto && elements.length > 0 ? (
        <section className="dico-page dico-page-break">
          <div className="dico-cad-print-box">
            <svg
              viewBox={`0 0 ${dico.drawing?.width || 1000} ${dico.drawing?.height || 640}`}
              width="100%"
              style={{ display: 'block' }}
            >
              <CadSvgRenderer drawing={dico.drawing} showGrid={false} showPorts interactive={false} />
            </svg>
          </div>

          <div className="dico-plate-bottom">
            <div className="dico-legend-box">
              <div className="dico-plate-label">LEGENDA COMPONENTI E TUBAZIONI</div>
              <div className="dico-legend-grid">
                {usedPipeTypes.map((pt) => (
                  <div key={pt.id} className="dico-legend-item">
                    <svg width="26" height="10" viewBox="0 0 26 10">
                      <line
                        x1="1"
                        y1="5"
                        x2="25"
                        y2="5"
                        stroke={pt.color}
                        strokeWidth={pt.strokeWidth}
                        strokeDasharray={pt.dash || undefined}
                      />
                    </svg>
                    <span>{pt.label}</span>
                  </div>
                ))}
                {usedSymbolTypes.map((sym) => (
                  <div key={sym.id} className="dico-legend-item">
                    <svg width="22" height="22" viewBox="-52 -52 104 104">
                      {renderSymbolGlyph(sym.id)}
                    </svg>
                    <span>{sym.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dico-cartiglio">
              <div className="dico-plate-label">SCHEMA DEGLI IMPIANTI</div>
              <div><strong>Allegato alla Dichiarazione N°:</strong> {dico.dico_number || '—'}</div>
              <div><strong>Impresa:</strong> {companyName}</div>
              <div><strong>Committente:</strong> {dico.client?.name || '—'}</div>
              <div><strong>Ubicazione:</strong> {locationLine || '—'}</div>
              <div className="dico-cartiglio-sign">
                <span>Data: {formatDate(dico.date) || '—'}</span>
                <span>Timbro e Firma R.T.</span>
              </div>
            </div>
          </div>

          <PageFooter label="Schema degli Impianti" />
        </section>
      ) : null}

      {/* ==================== RELAZIONE FOTOGRAFICA ==================== */}
      {(dico.photos || []).length > 0 ? (
        <section className="dico-page dico-page-break">
          <div className="dico-sub-header">
            <div>
              <strong>ALLEGATO — RELAZIONE FOTOGRAFICA</strong>
              <div className="dico-min-sub">
                DiCo N° {dico.dico_number || '—'} · {dico.client?.name || 'Committente'}
              </div>
            </div>
          </div>

          <div className="dico-photos-print-grid">
            {dico.photos.map((photo, idx) => (
              <figure key={photo.id} className="dico-photo-figure">
                <img src={photo.src} alt={photo.caption || `Foto ${idx + 1}`} />
                <figcaption>
                  <strong>Foto {idx + 1}:</strong> {photo.caption || 'Stato dei lavori'}
                </figcaption>
              </figure>
            ))}
          </div>

          <PageFooter label="Relazione Fotografica" />
        </section>
      ) : null}

      {/* ==================== LIBRETTO D'USO E MANUTENZIONE ==================== */}
      {opts.include_libretto ? (
        <>
          <section className="dico-page dico-page-break">
            <div className="dico-cover-box" style={{ marginTop: 14 }}>
              <div className="dico-cover-title" style={{ fontSize: '15pt' }}>
                LIBRETTO D’USO E MANUTENZIONE
                <br />
                {librettoTitle}
              </div>
              <div className="dico-cover-law">
                In conformità a quanto previsto dal D.M. 37/08 art. 8 comma 2, D.M. 20/06/2014 e D.P.R. 74/2013
              </div>
              <div className="dico-cover-section">
                <div className="dico-cover-label">Rilasciato da:</div>
                <div className="dico-cover-value-lg">{companyName}</div>
              </div>
              <div className="dico-cover-section">
                <div className="dico-cover-label">Impianto installato in:</div>
                <div><strong>{locationLine || '—'}</strong> · Proprietario: <strong>{ownerDisplay}</strong></div>
              </div>
            </div>

            <h3 className="dico-quadro-title" style={{ marginTop: 16 }}>
              1. Finalità e Responsabile dell’Impianto
            </h3>
            <p className="dico-lib-p">
              Il presente libretto fornisce al proprietario, occupante o Responsabile dell’impianto le
              indicazioni essenziali per un utilizzo sicuro, efficiente e salubre dell’impianto, unitamente
              alle prescrizioni dei costruttori degli apparecchi installati. Le attività di controllo e
              manutenzione ordinaria/straordinaria devono essere affidate esclusivamente ad imprese abilitate
              ai sensi del D.M. 37/08 (e certificate F-Gas per gli impianti di climatizzazione).
            </p>

            <h3 className="dico-quadro-title">2. Principali indicazioni per un corretto utilizzo</h3>
            <ul className="dico-lib-list">
              <li>Non manomettere, smontare o modificare alcuna parte dell’impianto o delle sicurezze.</li>
              <li>In caso di anomalie, odore di bruciato, perdite di gas o refrigerante, spegnere subito l’impianto dall’interruttore generale e contattare l’impresa manutentrice.</li>
              <li>Non ostruire griglie di ventilazione, aperture di aerazione o flussi d’aria degli apparecchi.</li>
              <li>Pulire periodicamente i filtri aria (per climatizzatori) esclusivamente a impianto spento e disalimentato, usando acqua tiepida e detergente neutro.</li>
              <li>Conservare il presente libretto insieme alla Dichiarazione di Conformità ed esibirlo in occasione delle verifiche periodiche.</li>
            </ul>

            <PageFooter label="Libretto Uso e Manutenzione — Pag. 1/2" />
          </section>

          <section className="dico-page dico-page-break">
            <div className="dico-sub-header">
              <strong>LIBRETTO D’USO E MANUTENZIONE — CONTROLLI PERIODICI E CONSEGNA</strong>
              <span className="dico-min-sub">Rif. DiCo N° {dico.dico_number || '—'}</span>
            </div>

            <table className="dico-mat-table" style={{ marginBottom: 14 }}>
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>Tipologia Controllo</th>
                  <th style={{ width: '58%' }}>Operazione di verifica e manutenzione</th>
                  <th style={{ width: '16%' }}>Periodicità</th>
                </tr>
              </thead>
              <tbody>
                {(LIBRETTO_CONTROLS[opts.libretto_type] || LIBRETTO_CONTROLS.clima).map(
                  ([group, items]) =>
                    items.map((text, idx) => (
                      <tr key={`${group}-${idx}`}>
                        {idx === 0 ? (
                          <td rowSpan={items.length}><strong>{group}</strong></td>
                        ) : null}
                        <td>{text}</td>
                        <td>Annuale</td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>

            <div className="dico-quadro-box" style={{ marginTop: 14 }}>
              <p style={{ margin: '0 0 8px' }}>
                Ai sensi del D.M. 22 gennaio 2008 n. 37 e del D.P.R. 74/2013, l’impresa{' '}
                <strong>{companyName}</strong> (P.IVA {issuer?.vat || '—'}), abilitata per le lettere{' '}
                <strong>{lettersText || '—'}</strong>, consegna il presente Libretto d’Uso e Manutenzione
                al Responsabile dell’impianto per i locali siti in <strong>{locationLine || '—'}</strong>,
                indicando una periodicità di manutenzione <strong>Annuale</strong> (salvo diverse prescrizioni
                del costruttore).
              </p>

              <div className="dico-signatures" style={{ marginTop: 22 }}>
                <div>
                  <div>Data e Luogo</div>
                  <strong>{formatDate(dico.date) || '____/____/________'} · {loc.city || '________'}</strong>
                </div>
                <div className="dico-sign-box">
                  <div>Il Responsabile Tecnico</div>
                  <div className="dico-sign-line">(timbro e firma)</div>
                </div>
                <div className="dico-sign-box">
                  <div>Per ricevuta e presa visione</div>
                  <div className="dico-sign-line">Firma del Responsabile dell’impianto</div>
                </div>
              </div>
            </div>

            <PageFooter label="Libretto Uso e Manutenzione — Pag. 2/2" />
          </section>
        </>
      ) : null}
    </div>
  );
}