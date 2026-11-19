import { useCallback, useEffect, useRef, useState } from 'react';

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechToText({ lang = 'it-IT', onFinalTranscript } = {}) {
  const isSupported = Boolean(getSpeechRecognitionCtor());
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef(null);
  const onFinalRef = useRef(onFinalTranscript);
  const lastFinalRef = useRef({ text: '', time: 0 });

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    clearRestartTimer();
    setIsListening(false);
    setInterimTranscript('');

    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* già fermo */
      }
    }
  }, []);

  const createInstance = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return null;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError('');
    };

    rec.onresult = (event) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim.trim());

      const cleanedFinal = finalChunk.trim();
      if (cleanedFinal) {
        // Protezione contro duplicati ravvicinati su Chrome Android
        const now = Date.now();
        const isAndroidDup =
          cleanedFinal.toLowerCase() === lastFinalRef.current.text.toLowerCase() &&
          now - lastFinalRef.current.time < 1200;

        if (!isAndroidDup) {
          lastFinalRef.current = { text: cleanedFinal, time: now };
          onFinalRef.current?.(cleanedFinal);
        }
        setInterimTranscript('');
      }
    };

    rec.onerror = (event) => {
      const code = event.error;
      if (code === 'no-speech' || code === 'aborted') {
        return;
      }

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setError('Permesso microfono negato dal browser.');
        shouldListenRef.current = false;
        setIsListening(false);
        return;
      }

      if (code === 'audio-capture') {
        setError('Nessun microfono rilevato sul dispositivo.');
        shouldListenRef.current = false;
        setIsListening(false);
        return;
      }

      if (code === 'network') {
        setError('Serve connessione internet per la dettatura vocale.');
        shouldListenRef.current = false;
        setIsListening(false);
        return;
      }

      setError('Errore durante il riconoscimento vocale.');
    };

    rec.onend = () => {
      setInterimTranscript('');
      // Fix Android: riavvia automaticamente se l'utente non ha premuto Stop
      if (shouldListenRef.current) {
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          if (!shouldListenRef.current) return;
          try {
            rec.start();
          } catch {
            shouldListenRef.current = false;
            setIsListening(false);
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    return rec;
  }, [lang]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Dettatura supportata su Chrome, Edge e Safari.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('La dettatura richiede HTTPS o localhost.');
      return;
    }

    setError('');
    shouldListenRef.current = true;

    if (!recognitionRef.current) {
      recognitionRef.current = createInstance();
    }

    try {
      recognitionRef.current?.start();
    } catch {
      // Se già attivo o in stato transitorio, ricrea l'istanza
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = createInstance();
      try {
        recognitionRef.current?.start();
      } catch {
        shouldListenRef.current = false;
        setIsListening(false);
        setError('Impossibile avviare il microfono. Riprova.');
      }
    }
  }, [createInstance, isSupported]);

  const toggle = useCallback(() => {
    if (isListening || shouldListenRef.current) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const clearError = useCallback(() => setError(''), []);

  // Cleanup allo smontaggio / cambio vista
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    start,
    stop,
    toggle,
    clearError,
  };
}