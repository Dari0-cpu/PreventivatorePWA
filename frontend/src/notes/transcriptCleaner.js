/**
 * Normalizza un frammento di testo proveniente dalla Web Speech API (it-IT).
 * Converte comandi vocali parlati, sistema gli spazi e applica le maiuscole.
 */
export function cleanTranscriptChunk(rawText, { capitalizeStart = false } = {}) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();
  if (!text) return '';

  // 1. Comandi vocali composti (prima di quelli singoli)
  text = text
    .replace(/\bpunto\s+e\s+a\s+capo\b/gi, '.\n')
    .replace(/\bpunto\s+interrogativo\b/gi, '?')
    .replace(/\bpunto\s+esclamativo\b/gi, '!')
    .replace(/\bpunto\s+e\s+virgola\b/gi, ';')
    .replace(/\bdue\s+punti\b/gi, ':')
    .replace(/\b(?:a\s+capo|nuova\s+riga)\b/gi, '\n')
    .replace(/\bvirgola\b/gi, ',')
    // Evita di convertire "punto acqua / punto gas / punto luce / punto scarico / punto termico"
    .replace(
      /\bpunto\b(?!\s+(?:acqua|gas|luce|scarico|termico|caldo|freddo|presa|rete|di|d'|per|su|in|a\s+muro))/gi,
      '.',
    );

  // 2. Pulizia spazi attorno a punteggiatura e ritorni a capo
  text = text
    .replace(/[ \t]+([.,;:?!])/g, '$1')
    .replace(/([.,;:?!])([^\s\n.,;:?!])/g, '$1 $2')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 3. Maiuscola dopo fine frase o a capo
  text = text.replace(/([.?!][ \t]+|\n)([a-zàèéìòù])/g, (_, sep, ch) => sep + ch.toUpperCase());

  // 4. Maiuscola iniziale se richiesto
  if (capitalizeStart) {
    text = text.replace(/^([a-zàèéìòù])/, (ch) => ch.toUpperCase());
  }

  return text;
}

/**
 * Unisce in modo pulito una frase dettata al testo già presente nella nota.
 */
export function appendTranscript(existingText, rawChunk) {
  const base = existingText || '';
  const trimmedEnd = base.replace(/[ \t]+$/, '');
  const needsCapital =
    !trimmedEnd ||
    /[.?!]\s*$/.test(trimmedEnd) ||
    trimmedEnd.endsWith('\n');

  const cleaned = cleanTranscriptChunk(rawChunk, { capitalizeStart: needsCapital });
  if (!cleaned) return base;

  if (!trimmedEnd) return cleaned;

  // Se il nuovo testo inizia con punteggiatura o a capo, non aggiungere spazio
  if (/^[.,;:?!\n]/.test(cleaned)) {
    return `${trimmedEnd}${cleaned}`;
  }

  // Se il testo esistente finisce con a capo, unisci direttamente
  if (trimmedEnd.endsWith('\n')) {
    return `${trimmedEnd}${cleaned}`;
  }

  return `${trimmedEnd} ${cleaned}`;
}