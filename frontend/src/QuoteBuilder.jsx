import React, { useState, useMemo } from 'react';

// Clienti fittizi per il test (come da step 2)
const MOCK_CLIENTS = [
  { id: '1', name: 'Mario Rossi' },
  { id: '2', name: 'BUILDING WORK SRL' }
];

export default function QuoteBuilder() {
  // --- STATO DEL PREVENTIVO ---
  const [quote, setQuote] = useState({
    client_id: '',
    object_title: '',
    payment_terms: '',
    notes: '',
    sections: []
  });

  // --- GESTIONE SEZIONI E RIGHE ---
  const addSection = () => {
    setQuote({
      ...quote,
      sections: [
        ...quote.sections,
        {
          id: crypto.randomUUID(), // ID temporaneo per la UI
          title: '',
          is_optional: false,
          sort_order: quote.sections.length + 1,
          lines: []
        }
      ]
    });
  };

  const updateSection = (sectionId, field, value) => {
    setQuote({
      ...quote,
      sections: quote.sections.map(s => 
        s.id === sectionId ? { ...s, [field]: value } : s
      )
    });
  };

  const addLine = (sectionId) => {
    setQuote({
      ...quote,
      sections: quote.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lines: [
              ...s.lines,
              {
                id: crypto.randomUUID(), // ID temporaneo per la UI
                description: '',
                qty: 1,
                unit_price: 0,
                vat_rate: 22,
                sort_order: s.lines.length + 1
              }
            ]
          };
        }
        return s;
      })
    });
  };

  const updateLine = (sectionId, lineId, field, value) => {
    setQuote({
      ...quote,
      sections: quote.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lines: s.lines.map(l => 
              l.id === lineId ? { ...l, [field]: value } : l
            )
          };
        }
        return s;
      })
    });
  };

  // --- CALCOLO LIVE (Stessa logica del backend Python) ---
  const totals = useMemo(() => {
    let totalNet = 0;
    let totalVat = 0;

    quote.sections.forEach(section => {
      // Ignora le sezioni opzionali nel calcolo totale
      if (section.is_optional) return;

      section.lines.forEach(line => {
        const qty = parseFloat(line.qty) || 0;
        const price = parseFloat(line.unit_price) || 0;
        const vatRate = parseFloat(line.vat_rate) || 0;

        // Calcoli (in un'app reale di produzione si usa Decimal.js, qui approssimiamo per semplicità UI)
        const lineNet = qty * price;
        const lineVat = lineNet * (vatRate / 100);

        totalNet += lineNet;
        totalVat += lineVat;
      });
    });

    return {
      net: totalNet,
      vat: totalVat,
      gross: totalNet + totalVat
    };
  }, [quote.sections]);

  // --- HELPER PER I BADGE ---
  const insertText = (field, text) => {
    setQuote(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${text}` : text
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      
      {/* HEADER DELLA PAGINA */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Nuovo Preventivo</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Salva Bozza
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* 1. DATI TESTATA */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dati Generali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                value={quote.client_id}
                onChange={(e) => setQuote({...quote, client_id: e.target.value})}
              >
                <option value="">Seleziona un cliente...</option>
                {MOCK_CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto Preventivo</label>
              <input 
                type="text" 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Es. Preventivo climatizzazione..."
                value={quote.object_title}
                onChange={(e) => setQuote({...quote, object_title: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* 2. SEZIONI E RIGHE */}
        <div className="space-y-4">
          {quote.sections.map((section, sIndex) => (
            <section key={section.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative overflow-hidden">
              {/* Etichetta visiva se opzionale */}
              {section.is_optional && (
                <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  OPZIONALE (Escluso dal totale)
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex-grow">
                  <input 
                    type="text" 
                    className="w-full text-lg font-bold text-gray-800 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-0 px-0 bg-transparent"
                    placeholder="Titolo Sezione (es. OPZIONE 1 o Fornitura)"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="checkbox" 
                    id={`opt-${section.id}`}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    checked={section.is_optional}
                    onChange={(e) => updateSection(section.id, 'is_optional', e.target.checked)}
                  />
                  <label htmlFor={`opt-${section.id}`} className="text-sm text-gray-600 cursor-pointer">
                    Opzione alternativa
                  </label>
                </div>
              </div>

              {/* Righe della sezione */}
              <div className="space-y-3">
                {section.lines.map((line, lIndex) => (
                  <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 items-start">
                    <div className="md:col-span-6">
                      <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Descrizione</label>
                      <textarea 
                        rows="2"
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 p-2 border resize-none"
                        placeholder="Descrizione voce..."
                        value={line.description}
                        onChange={(e) => updateLine(section.id, line.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantità</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.1"
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        value={line.qty}
                        onChange={(e) => updateLine(section.id, line.id, 'qty', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prezzo Un. (€)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        value={line.unit_price}
                        onChange={(e) => updateLine(section.id, line.id, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">IVA (%)</label>
                      <select 
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        value={line.vat_rate}
                        onChange={(e) => updateLine(section.id, line.id, 'vat_rate', parseInt(e.target.value))}
                      >
                        <option value="22">22%</option>
                        <option value="10">10%</option>
                        <option value="4">4%</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => addLine(section.id)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                + Aggiungi Voce
              </button>
            </section>
          ))}

          <button 
            onClick={addSection}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium flex justify-center items-center gap-2"
          >
            + Aggiungi Nuova Sezione
          </button>
        </div>

        {/* 3. CONDIZIONI E NOTE */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
          {/* Payment Terms */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-700">Modalità di pagamento</label>
              <div className="flex gap-2">
                <button onClick={() => insertText('payment_terms', '30% all\'ordine\nSaldo fine lavori')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded">30% Acconto</button>
                <button onClick={() => insertText('payment_terms', '30% inizio lavori\n30% schemature ultimate\n20% montaggi\nSaldo al collaudo')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded">A SAL</button>
              </div>
            </div>
            <textarea 
              rows="3"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border resize-none text-sm"
              value={quote.payment_terms}
              onChange={(e) => setQuote({...quote, payment_terms: e.target.value})}
            />
          </div>

          {/* Notes */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-700">Note e Clausole</label>
              <div className="flex gap-2">
                <button onClick={() => insertText('notes', 'NOTA BENE:\nL\'area di lavoro deve essere lasciata completamente libera da cose e persone per tutta la durata dell\'intervento.')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded">Area Libera</button>
                <button onClick={() => insertText('notes', 'NOTA BENE:\nIl presente preventivo è da ritenersi indicativo e soggetto a revisione.')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded">Soggetto a revisione</button>
              </div>
            </div>
            <textarea 
              rows="3"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border resize-none text-sm"
              value={quote.notes}
              onChange={(e) => setQuote({...quote, notes: e.target.value})}
            />
          </div>
        </section>

      </main>

      {/* 4. PANNELLO TOTALI (Fisso in basso) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex gap-6 w-full sm:w-auto">
            <div>
              <p className="text-xs text-gray-500 font-medium">Imponibile</p>
              <p className="text-lg font-semibold text-gray-800">€ {totals.net.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Imposta (IVA)</p>
              <p className="text-lg font-semibold text-gray-800">€ {totals.vat.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Totale Preventivo</p>
              <p className="text-2xl font-bold text-blue-600">€ {totals.gross.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-sm transition-colors whitespace-nowrap">
              Genera PDF
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}