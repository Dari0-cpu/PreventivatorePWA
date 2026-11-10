import React, { useRef } from 'react';
import Decimal from 'decimal.js';

// Helper sicuro: estrae solo il numero valido evitando crash di Decimal.js
export const safeDecimal = (val) => {
  if (!val) return new Decimal(0);
  const cleaned = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  try {
    return cleaned ? new Decimal(cleaned) : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
};

export function CustomQuoteSection({ section, onUpdateSection, onRemoveSection }) {
  const editorRef = useRef(null);

  // Applica grassetto, sottolineato o corsivo sul testo selezionato nel blocco
  const applyFormat = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      onUpdateSection({ ...section, richDescription: editorRef.current.innerHTML });
    }
  };

  // Gestione punti della lista numerata (1., 2., 3. ...)
  const handleItemChange = (index, value) => {
    const updated = [...(section.listItems || [])];
    updated[index] = value;
    onUpdateSection({ ...section, listItems: updated });
  };

  const addListItem = () => {
    onUpdateSection({
      ...section,
      listItems: [...(section.listItems || []), '']
    });
  };

  const removeListItem = (index) => {
    const updated = (section.listItems || []).filter((_, i) => i !== index);
    onUpdateSection({ ...section, listItems: updated });
  };

  return (
    <div className="border border-slate-300 rounded-lg p-4 mb-6 bg-white shadow-sm">
      {/* Titolo Sezione */}
      <div className="flex justify-between items-center mb-3 gap-2">
        <input
          type="text"
          value={section.title || ''}
          onChange={(e) => onUpdateSection({ ...section, title: e.target.value })}
          placeholder="Titolo sezione (es. Impianto Idraulico / Climatizzazione)"
          className="text-lg font-bold w-full border-b border-slate-200 focus:border-blue-600 outline-none py-1"
        />
        <button
          type="button"
          onClick={onRemoveSection}
          className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
        >
          Elimina
        </button>
      </div>

      {/* Blocco Testo Libero con Grassetto, Sottolineato, Corsivo */}
      <div className="mb-4">
        <div className="flex gap-1 mb-1 bg-slate-100 p-1 rounded border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="px-2.5 py-1 font-bold text-sm hover:bg-white rounded"
            title="Grassetto (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className="px-2.5 py-1 underline text-sm hover:bg-white rounded"
            title="Sottolineato (Ctrl+U)"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="px-2.5 py-1 italic text-sm hover:bg-white rounded"
            title="Corsivo (Ctrl+I)"
          >
            I
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) =>
            onUpdateSection({ ...section, richDescription: e.currentTarget.innerHTML })
          }
          dangerouslySetInnerHTML={{ __html: section.richDescription || '' }}
          className="min-h-[80px] p-2.5 border border-slate-200 rounded focus:outline-blue-600 text-sm leading-relaxed"
          placeholder="Note introduttive o descrizione libera..."
        />
      </div>

      {/* Lista Numerata (1. Fornitura e posa..., 2. Montaggio..., 3. ...) */}
      <div className="space-y-2 mb-4">
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Elenco Lavorazioni (Lista Numerata)
        </label>
        {(section.listItems || []).map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="font-bold text-slate-700 pt-2 min-w-[24px]">
              {idx + 1}.
            </span>
            <textarea
              rows={2}
              value={item}
              onChange={(e) => handleItemChange(idx, e.target.value)}
              placeholder={
                idx === 0
                  ? 'Es. Fornitura e posa in opera di...'
                  : idx === 1
                  ? 'Es. Montaggio e collaudo...'
                  : 'Descrivi lavorazione...'
              }
              className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-600 outline-none resize-y"
            />
            <button
              type="button"
              onClick={() => removeListItem(idx)}
              className="text-slate-400 hover:text-red-500 pt-2 px-1"
              title="Rimuovi punto"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addListItem}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 mt-1"
        >
          + Aggiungi punto ({(section.listItems || []).length + 1}.)
        </button>
      </div>

      {/* Costo finale di quanto sopra descritto + Dicitura IVA manuale */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 bg-slate-50 p-3 rounded">
        <span className="text-sm font-semibold text-slate-700 mr-auto">
          Costo complessivo di quanto sopra descritto:
        </span>

        <div className="flex items-center gap-1">
          <span className="text-slate-600 font-semibold">€</span>
          <input
            type="text"
            value={section.sectionPrice || ''}
            onChange={(e) =>
              onUpdateSection({ ...section, sectionPrice: e.target.value })
            }
            placeholder="0,00"
            className="w-28 p-1.5 border border-slate-300 rounded text-right font-bold text-slate-900"
          />
        </div>

        {/* Campo libero per scrivere "+ IVA", "+ IVA cadauno", "IVA esclusa", ecc. */}
        <input
          type="text"
          value={section.vatNote ?? '+ IVA'}
          onChange={(e) =>
            onUpdateSection({ ...section, vatNote: e.target.value })
          }
          placeholder="Es. + IVA, + IVA cadauno..."
          className="w-40 p-1.5 border border-slate-300 rounded text-sm font-medium text-slate-700"
        />
      </div>
    </div>
  );
}