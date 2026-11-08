# SPEC.md - PreventivatorePWA

## 1. Architettura di Sistema e Obiettivi

Applicazione Full-Stack "Offline-First" per la generazione, calcolo e gestione di preventivi complessi. L'architettura prevede una separazione netta tra core logico/matematico (Backend Python/FastAPI) e presentazione/interfaccia (Frontend PWA Vanilla JS/React), supportata da un database relazionale (Supabase/PostgreSQL) e generazione documentale tramite `html2pdf.js`.

  
L'obiettivo è digitalizzare flussi di lavoro strutturati per aziende termoidrauliche come la Cri.Ma. Impianti S.R.L., gestendo calcoli fiscali precisi, modalità di pagamento multiple e opzioni alternative all'interno dello stesso documento.


## 2. Analisi dei Requisiti di Dominio (Dai Documenti Reali)

Per garantire che il software risponda alle reali esigenze di cantiere, il modello dati deve riflettere la flessibilità dei preventivi aziendali:

  
- **Supporto Multi-Sezione e Varianti**: Un singolo preventivo può contenere impianti distinti (es. "Preventivo di spesa climatizzazione" e "Preventivo: Ricambio Aria"). Deve inoltre supportare scenari mutuamente esclusivi, come la proposta di una "OPZIONE 1" (riparazione) rispetto a una "OPZIONE 2" (rifacimento completo).
    
- **Testi Descrittivi Complessi**: Le singole voci non sono semplici etichette, ma descrizioni estese che includono forniture, modelli specifici (es. "modello unità esterna MU2R17") e operazioni di posa in opera.
    
- **Condizioni e Note Flessibili**: Il sistema deve gestire sezioni di testo libero per clausole importanti (es. "L'area di lavoro deve essere lasciata completamente libera...") e modalità di pagamento variabili, che spaziano da un semplice "30% all'ordine / Saldo fine lavori" a piani scaglionati complessi (es. 30% inizio, 30% schemature, 20% montaggi, saldo al collaudo).
    
- **Dati Intestazione**: Ogni preventivo richiede un "OGGETTO" specifico e l'anagrafica completa del destinatario.
    

## 3. Schema Database (Relazionale PostgreSQL)

Per supportare la flessibilità richiesta (opzioni e sezioni), il database adotterà una struttura gerarchica a 4 livelli principali.

### 3.1 `clients` (Anagrafica Clienti)

| **Campo** | **Tipo** | **Vincoli** | **Descrizione**                                  |
| --------- | -------- | ----------- | ------------------------------------------------ |
| `id`      | UUID     | Primary Key | Identificativo univoco                           |
| `name`    | VARCHAR  | NOT NULL    | Nome o Ragione Sociale (es. "BUILDING WORK SRL") |
| `address` | VARCHAR  | NOT NULL    | Indirizzo completo e città                       |

### 3.2 `catalog_items` (Listino Base)

|**Campo**|**Tipo**|**Vincoli**|**Descrizione**|
|---|---|---|---|
|`id`|UUID|Primary Key|Identificativo univoco|
|`code`|VARCHAR|UNIQUE|Codice articolo interno|
|`description`|TEXT|NOT NULL|Descrizione base (sovrascrivibile)|
|`unit_price`|DECIMAL|NOT NULL|Prezzo base (Precisione contabile)|
|`vat_rate`|INTEGER|NOT NULL|Aliquota IVA (es. 4, 10, 22)|

### 3.3 `quotes` (Testata Preventivo)

| **Campo**       | **Tipo** | **Vincoli**     | **Descrizione**                         |
| --------------- | -------- | --------------- | --------------------------------------- |
| `id`            | UUID     | Primary Key     | Identificativo univoco                  |
| `client_id`     | UUID     | Foreign Key     | Collegamento a `clients`                |
| `object_title`  | VARCHAR  | NOT NULL        | Oggetto del documento                   |
| `payment_terms` | TEXT     | NULL            | Es: "50% alla firma, Saldo fine lavori" |
| `notes`         | TEXT     | NULL            | Clausole ("NOTA BENE")                  |
| `total_net`     | DECIMAL  | NOT NULL        | Imponibile totale calcolato             |
| `total_vat`     | DECIMAL  | NOT NULL        | Imposta totale calcolata                |
| `total_gross`   | DECIMAL  | NOT NULL        | Totale generale                         |

### 3.4 `quote_sections` (Sezioni / Opzioni)

Permette di dividere il preventivo in blocchi come "OPZIONE 1" o "Ricambio Aria".

|**Campo**|**Tipo**|**Vincoli**|**Descrizione**|
|---|---|---|---|
|`id`|UUID|Primary Key|Identificativo univoco|
|`quote_id`|UUID|Foreign Key|Collegamento a `quotes`|
|`title`|VARCHAR|NOT NULL|Titolo sezione (es. "OPZIONE 1")|
|`is_optional`|BOOLEAN|DEFAULT FALSE|Se TRUE, il totale non somma al totale generale|
|`sort_order`|INTEGER|NOT NULL|Ordine di visualizzazione nel PDF|

### 3.5 `quote_lines` (Righe di Dettaglio)

| **Campo**      | **Tipo** | **Vincoli** | **Descrizione**                            |
| -------------- | -------- | ----------- | ------------------------------------------ |
| `id`           | UUID     | Primary Key | Identificativo univoco                     |
| `section_id`   | UUID     | Foreign Key | Collegamento a `quote_sections`            |
| `description`  | TEXT     | NOT NULL    | Es: "Smontaggio dei sanitari"              |
| `qty`          | DECIMAL  | NOT NULL    | Quantità (supporta decimali per ore/metri) |
| `unit_price`   | DECIMAL  | NOT NULL    | Prezzo unitario applicato                  |
| `vat_rate`     | INTEGER  | NOT NULL    | Aliquota IVA applicata alla riga           |
| `sort_order`   | INTEGER  | NOT NULL    | Ordine della riga (numerazione 1, 2, 3...) |

## 4. API REST Endpoints (FastAPI)

Tutte le richieste e risposte devono essere validate tramite **Pydantic**.


- **`GET /api/v1/clients`** - Ricerca e autocompletamento anagrafiche.
    
- **`GET /api/v1/catalog`** - Ricerca rapida componenti e manodopera.
    
- **`POST /api/v1/quotes`** - Creazione di un nuovo preventivo (riceve un JSON annidato con sezioni e righe).
    
- **`GET /api/v1/quotes/{id}`** - Recupero preventivo completo per rendering UI/PDF.
    
- **`PUT /api/v1/quotes/{id}`** - Aggiornamento bozza.
    
- **`POST /api/v1/ai/parse-quote`** (Fase 5) - Endpoint per l'elaborazione del linguaggio naturale (NLP). Riceve audio trascritto o testo libero e restituisce un JSON strutturato conforme allo schema Pydantic di creazione preventivo.


## 5. Motore di Calcolo (Regole per `calculations.py`)

Per evitare errori di approssimazione in virgola mobile, il backend **deve obbligatoriamente utilizzare il modulo `decimal.Decimal`** di Python per ogni operazione finanziaria.

  

1. **Arrotondamento**: Utilizzare `ROUND_HALF_UP` a 2 cifre decimali alla fine del calcolo di ogni singola riga.
    
2. **Calcolo Riga (Line Net)**:$\text{LineNet} = \text{ROUND}(\text{qty} \times \text{unit\_price} \times, 2)$

## 6. Generazione Layout e Documenti

L'interfaccia PWA gestirà la compilazione in logica Offline-First (salvataggio IndexDB in assenza di rete), sfruttando `html2pdf.js` per emettere un layout ufficiale.


Il layout finale generato a cantiere deve replicare la struttura dei documenti esistenti:
  


- Header (Griglia a 2 Colonne)

* **Colonna Sinistra (Dati Azienda / Emittente):**
  * **Logo & Denominazione:** Logo aziendale e Ragione Sociale in grassetto (es. `CRI.MA IMPIANTI S.R.L.`).
  * **Recapiti & Fiscale (subito sotto):**
    * Indirizzo sede (es. `Via Gabrio Casati 15, 00012 Guidonia (RM)`)
    * Partita IVA (es. `P.IVA: 17953441007`)
    * Email di contatto (es. `info.crimaimpianti@gmail.com`)
    * Recapito telefonico (es. `+39 348 3352372`)

* **Colonna Destra (Identificativo Documento & Dati Cliente):**
  * **Identificativo (in alto a destra, allineato al logo):**
    * Dicitura e numero preventivo in evidenza (es. `PREVENTIVO N° 20`).
  * **Dati Destinatario & Data (subito sotto l'identificativo):**
    * **Data:** Data di emissione (es. `Data: 10/09/2026`).
    * **Intestazione Destinatario:** Formula di cortesia + Nome/Cognome o Ragione Sociale (es. `SPETT.LE Narzisi Giorgio` o titolo equivalente `Dott. / Ing.`).
    * **Indirizzo Cliente:** Luogo/residenza o indirizzo di fatturazione del cliente.

---

- Corpo del Documento (Fuori dall'Header)

* **Oggetto del Preventivo:**
  * Posizionato immediatamente al di sotto dell'header, a tutta larghezza.
  * Formattato con prefisso in maiuscolo/grassetto: `OGGETTO: Preventivo di spesa come da capitolato.` (o descrizione personalizzata del cantiere/lavoro).
      
    
- **Corpo Modulare**: Stampa iterativa delle `quote_sections`. Se ci sono più opzioni, il PDF renderizza chiare interruzioni visive tra "OPZIONE 1" e le successive.
    
      
    
- **Footer Commerciale**: Inclusione del totale chiaro (+ IVA), il blocco "Modalità di pagamento" ed eventuali sezioni "NOTA BENE". Aggiunta del blocco "Firma per accettazione".


```plaintext

+-----------------------------------------------------------------------------+
| [LOGO] CRI.MA IMPIANTI S.R.L.                           PREVENTIVO N° 20    |
|                                                                             |
| Via Gabrio Casati 15, 00012 Guidonia (RM)               Data: 10/09/2026    |
| P.IVA: 17953441007                                      SPETT.LE            |
| info.crimaimpianti@gmail.com                            Narzisi Giorgio     |
| +39 348 3352372                                         [Indirizzo Cliente] |
+-----------------------------------------------------------------------------+

OGGETTO: Preventivo di spesa come da capitolato.

-------------------------------------------------------------------------------
[Voci di capitolato, dettagli lavorazioni e importi...]
```
