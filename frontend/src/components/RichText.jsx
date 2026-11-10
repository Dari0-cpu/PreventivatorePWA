import React, { useEffect, useRef } from 'react';

const TOOLS = [
  { command: 'bold', label: 'G', title: 'Grassetto', style: { fontWeight: 700 } },
  { command: 'italic', label: 'C', title: 'Corsivo', style: { fontStyle: 'italic' } },
  { command: 'underline', label: 'S', title: 'Sottolineato', style: { textDecoration: 'underline' } },
  { command: 'insertUnorderedList', label: '•', title: 'Elenco puntato' },
  { command: 'insertOrderedList', label: '1.', title: 'Elenco numerato' },
  { command: 'removeFormat', label: '✕', title: 'Togli la formattazione' },
];

/**
 * Editor di testo formattabile (grassetto, corsivo, sottolineato, elenchi).
 * Il contenuto vive in HTML semplice: `value` viene scritto nel DOM una sola
 * volta al montaggio, poi il DOM è la fonte di verità e ogni input risale a `onChange`.
 */
export function RichText({ value, onChange, placeholder = 'Scrivi qui…' }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
    // Solo al montaggio: dopo, l'HTML lo produce l'utente che digita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const runCommand = (command) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, null);
    sync();
  };

  /** Il testo incollato entra come testo semplice: niente CSS altrui nel preventivo. */
  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    sync();
  };

  return (
    <div className="rich">
      <div className="rich-toolbar" role="toolbar" aria-label="Formattazione testo">
        {TOOLS.map((tool) => (
          <button
            key={tool.command}
            type="button"
            className="rich-btn"
            style={tool.style}
            title={tool.title}
            aria-label={tool.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(tool.command)}
          >
            {tool.label}
          </button>
        ))}
        <span className="rich-hint">Seleziona il testo e formatta</span>
      </div>

      <div
        ref={editorRef}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={sync}
        onBlur={sync}
        onPaste={handlePaste}
      />
    </div>
  );
}
