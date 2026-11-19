import { useCallback, useEffect, useRef, useState } from 'react';

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function useSpeechToText({ lang = 'it-IT', onFinalTranscript } = {}) {
  const isSupported = Boolean(getSpeechRecognitionCtor());
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const isRunningRef = useRef(false);
  const restartTimerRef = useRef(null);
  const onFinalRef = useRef(onFinalTranscript);

  // Su Android accumula la frase corrente e la salva UNA sola volta in onend
  const sessionBufferRef = useRef('');
  // Su Desktop evita di salvare due volte lo stesso resultIndex
  const committedIndexRef = useRef(-1);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const flushAndroidBuffer = useCallback(() => {
    const text = sessionBufferRef.current.trim();
    sessionBufferRef.current = '';
    setInterimTranscript('');
    if (text) {
      onFinalRef.current?.(text);
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    clearRestartTimer();
    setIsListening(false);

    const rec = recognitionRef.current;
    if (rec && isRunningRef.current) {
      try {
        rec.stop();
      } catch {
        isRunningRef.current = false;
        flushAndroidBuffer();
      }
    } else {
      flushAndroidBuffer();
    }
  }, [flushAndroidBuffer]);

  const createInstance = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return null;

    const android = isAndroidDevice();
    const rec = new Ctor();
    rec.lang = lang;
    // Fix Android: continuous=false evita il bug della frase ripetuta a ogni parola
    rec.continuous = !android;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isRunningRef.current = true;
      committedIndexRef.current = -1;
      sessionBufferRef.current = '';
      setIsListening(true);
      setError('');
    };

    rec.onresult = (event) => {
      if (android) {
        const latest = event.results[event.results.length - 1]?.[0]?.transcript || '';
        const cleaned = latest.trim();
        if (cleaned) {
          sessionBufferRef.current = cleaned;
          setInterimTranscript(cleaned);
        }
        return;
      }

      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          if (i > committedIndexRef.current) {
            committedIndexRef.current = i;
            finalChunk += `${transcript} `;
          }
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim.trim());

      const cleanedFinal = finalChunk.trim();
      if (cleanedFinal) {
        onFinalRef.current?.(cleanedFinal);
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
      isRunningRef.current = false;

      if (android) {
        flushAndroidBuffer();
      } else {
        setInterimTranscript('');
      }

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
        }, android ? 250 : 150);
      } else {
        setIsListening(false);
      }
    };

    return rec;
  }, [flushAndroidBuffer, lang]);

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

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      isRunningRef.current = false;
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