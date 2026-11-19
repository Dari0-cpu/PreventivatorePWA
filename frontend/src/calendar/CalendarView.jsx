import React, { useEffect, useMemo, useState } from 'react';
import {
  EVENT_TITLE_PRESETS,
  createEmptyEvent,
  sortEventsByTime,
} from './calendarModel';
import { formatDate, todayIso } from '../lib/format';
import { clientLabel, clientSubLabel, formatClientAddress } from '../quote/quoteModel';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function toIsoDate(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseIsoParts(iso) {
  const [y, m, d] = String(iso || todayIso()).split('-').map(Number);
  return { year: y, monthIndex: (m || 1) - 1, day: d || 1 };
}

function formatItalianFullDate(iso) {
  const { year, monthIndex, day } = parseIsoParts(iso);
  const dateObj = new Date(year, monthIndex, day);
  const formatted = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMonthYear(year, monthIndex) {
  const dateObj = new Date(year, monthIndex, 1);
  const label = dateObj.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildMonthCells(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  // Lunedì = 0 ... Domenica = 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    const prevDate = new Date(year, monthIndex - 1, day);
    cells.push({
      iso: toIsoDate(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()),
      day,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      iso: toIsoDate(year, monthIndex, day),
      day,
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const nextDate = new Date(year, monthIndex + 1, nextDay);
    cells.push({
      iso: toIsoDate(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate()),
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function CalendarView({
  events,
  clients,
  onSaveEvent,
  onToggleDone,
  onDeleteEvent,
  prefill,
  onClearPrefill,
  jumpTodayTrigger,
}) {
  const today = todayIso();
  const initialParts = parseIsoParts(today);

  const [viewYear, setViewYear] = useState(initialParts.year);
  const [viewMonth, setViewMonth] = useState(initialParts.monthIndex);
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => createEmptyEvent(today));
  const [clientSuggestOpen, setClientSuggestOpen] = useState(false);

  // Gestisce precompilazione da una Nota ("Fissa appuntamento")
  useEffect(() => {
    if (!prefill) return;
    setEditingId(null);
    setForm(createEmptyEvent(selectedDate, prefill));
    onClearPrefill?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  // Trigger esterno "Oggi" dalla topbar
  useEffect(() => {
    if (!jumpTodayTrigger) return;
    const parts = parseIsoParts(todayIso());
    setViewYear(parts.year);
    setViewMonth(parts.monthIndex);
    setSelectedDate(todayIso());
  }, [jumpTodayTrigger]);

  // Quando cambia il giorno selezionato e non si sta modificando un evento, aggiorna la data del form
  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate, editingId]);

  const monthCells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev?.date) return;
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(
    () => sortEventsByTime(eventsByDate[selectedDate] || []),
    [eventsByDate, selectedDate],
  );

  const upcomingEvents = useMemo(() => {
    return events
      .filter((ev) => !ev.done && ev.date >= today)
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        const tA = (a.time || '').trim();
        const tB = (b.time || '').trim();
        if (!tA && !tB) return 0;
        if (!tA) return -1;
        if (!tB) return 1;
        return tA.localeCompare(tB);
      })
      .slice(0, 5);
  }, [events, today]);

  const clientSuggestions = useMemo(() => {
    const query = (form.client_name || '').trim().toLowerCase();
    const pool = clients.filter((item) => item.name);
    const matches = query
      ? pool.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.city || '').toLowerCase().includes(query) ||
            (item.address || '').toLowerCase().includes(query),
        )
      : pool;
    return matches.slice(0, 5);
  }, [form.client_name, clients]);

  const isSuggestOpen = clientSuggestOpen && clientSuggestions.length > 0;

  const navigateMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const jumpToDate = (iso) => {
    const parts = parseIsoParts(iso);
    setViewYear(parts.year);
    setViewMonth(parts.monthIndex);
    setSelectedDate(iso);
  };

  const pickClient = (item) => {
    setForm((prev) => ({
      ...prev,
      client_name: item.name || '',
      address: formatClientAddress(item) || prev.address,
      phone: item.phone || prev.phone,
    }));
    setClientSuggestOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() && !form.client_name.trim()) return;

    await onSaveEvent({
      ...form,
      date: form.date || selectedDate,
      title: form.title.trim() || 'Appuntamento',
    });

    setEditingId(null);
    setForm(createEmptyEvent(selectedDate));
  };

  const handleEdit = (ev) => {
    setEditingId(ev.id);
    setForm({ ...ev });
    jumpToDate(ev.date);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(createEmptyEvent(selectedDate));
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Eliminare questo impegno dal calendario?')) return;
    await onDeleteEvent(eventId);
    if (editingId === eventId) {
      handleCancelEdit();
    }
  };

  return (
    <div className="cal-layout">
      {/* COLONNA SINISTRA: GRIGLIA MENSILE + PROSSIMI IMPEGNI */}
      <div className="cal-left-col">
        <div className="panel">
          <div className="cal-header">
            <h2 className="cal-month-title">{formatMonthYear(viewYear, viewMonth)}</h2>
            <div className="cal-nav">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => jumpToDate(today)}
              >
                Oggi
              </button>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => navigateMonth(-1)}
                aria-label="Mese precedente"
              >
                ‹
              </button>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => navigateMonth(1)}
                aria-label="Mese successivo"
              >
                ›
              </button>
            </div>
          </div>

          <div className="cal-weekdays">
            {WEEKDAYS.map((dayName) => (
              <span key={dayName} className="cal-weekday">
                {dayName}
              </span>
            ))}
          </div>

          <div className="cal-grid">
            {monthCells.map((cell) => {
              const dayEvents = eventsByDate[cell.iso] || [];
              const isToday = cell.iso === today;
              const isSelected = cell.iso === selectedDate;
              const allDone = dayEvents.length > 0 && dayEvents.every((ev) => ev.done);

              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={[
                    'cal-cell',
                    !cell.inCurrentMonth ? 'is-outside' : '',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => jumpToDate(cell.iso)}
                >
                  <span className="cal-day-num">{cell.day}</span>
                  {dayEvents.length > 0 ? (
                    <span className="cal-dots" aria-label={`${dayEvents.length} impegni`}>
                      {dayEvents.length <= 3 ? (
                        dayEvents.map((ev) => (
                          <span
                            key={ev.id}
                            className={`cal-dot ${ev.done || allDone ? 'is-done' : ''}`}
                          />
                        ))
                      ) : (
                        <span className={`cal-count-badge ${allDone ? 'is-done' : ''}`}>
                          {dayEvents.length}
                        </span>
                      )}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* BOX PROSSIMI IMPEGNI */}
        <div className="panel">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <span className="eyebrow">Prossimi impegni</span>
            <span className="small muted">Da oggi in poi</span>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="small muted">Nessun impegno programmato.</div>
          ) : (
            <div className="cal-upcoming-list">
              {upcomingEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  className="cal-upcoming-item"
                  onClick={() => jumpToDate(ev.date)}
                >
                  <div className="cal-upcoming-when">
                    <span className="amount">
                      {ev.date === today ? 'Oggi' : formatDate(ev.date)}
                    </span>
                    <span className="muted">{ev.time || 'Giornata'}</span>
                  </div>
                  <div className="cal-upcoming-what">
                    <strong>{ev.client_name || ev.title}</strong>
                    {ev.client_name && ev.title ? (
                      <span className="muted"> · {ev.title}</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COLONNA DESTRA: AGENDA DEL GIORNO + AGGIUNTA RAPIDA */}
      <div className="cal-right-col">
        <div className="panel">
          <div className="panel-head" style={{ marginBottom: 14 }}>
            <div>
              <div className="eyebrow">Agenda del giorno</div>
              <h2 className="panel-title" style={{ marginTop: 2 }}>
                {formatItalianFullDate(selectedDate)}
              </h2>
            </div>
            <span className="step-num">
              {selectedDayEvents.length}{' '}
              {selectedDayEvents.length === 1 ? 'impegno' : 'impegni'}
            </span>
          </div>

          {/* FORM AGGIUNTA / MODIFICA RAPIDA */}
          <form className="cal-quick-form" onSubmit={handleSubmit}>
            <div className="cal-form-top">
              <div className="field">
                <label className="field-label" htmlFor="cal-ora">
                  Ora (opzionale)
                </label>
                <input
                  id="cal-ora"
                  type="time"
                  className="input amount-input"
                  style={{ textAlign: 'left' }}
                  value={form.time}
                  onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>

              <div className="field suggest-wrap">
                <label className="field-label" htmlFor="cal-cliente">
                  Cliente
                </label>
                <input
                  id="cal-cliente"
                  type="text"
                  className="input"
                  autoComplete="off"
                  placeholder="Es. Mario Rossi"
                  value={form.client_name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, client_name: e.target.value }));
                    setClientSuggestOpen(true);
                  }}
                  onFocus={() => setClientSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setClientSuggestOpen(false), 130)}
                />
                {isSuggestOpen ? (
                  <div className="suggest" role="listbox">
                    {clientSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="suggest-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickClient(item)}
                      >
                        {clientLabel(item)}
                        {clientSubLabel(item) ? <small>{clientSubLabel(item)}</small> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label" htmlFor="cal-titolo">
                Motivo / Titolo
              </label>
              <input
                id="cal-titolo"
                type="text"
                className="input"
                placeholder="Es. Passo per misure caldaia"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <div className="chip-row" style={{ marginTop: 4 }}>
                {EVENT_TITLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="chip"
                    onClick={() => setForm((prev) => ({ ...prev, title: preset }))}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div className="field">
                <label className="field-label" htmlFor="cal-indirizzo">
                  Indirizzo
                </label>
                <input
                  id="cal-indirizzo"
                  type="text"
                  className="input"
                  placeholder="Via, città"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="cal-tel">
                  Telefono
                </label>
                <input
                  id="cal-tel"
                  type="tel"
                  inputMode="tel"
                  className="input"
                  placeholder="+39 ..."
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label" htmlFor="cal-note">
                Note (opzionale)
              </label>
              <textarea
                id="cal-note"
                className="textarea"
                rows={2}
                placeholder="Es. Portare manometro, citofonare scala B…"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="row-between" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!form.title.trim() && !form.client_name.trim()}
                >
                  {editingId ? 'Salva modifiche' : '+ Aggiungi impegno'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleCancelEdit}
                  >
                    Annulla
                  </button>
                ) : null}
              </div>
              {editingId ? (
                <span className="small muted">Modifica impegno in corso</span>
              ) : null}
            </div>
          </form>

          {/* LISTA IMPEGNI DEL GIORNO */}
          <div className="cal-day-list">
            {selectedDayEvents.length === 0 ? (
              <div className="cal-day-empty">
                Nessun impegno segnato per questa giornata.
              </div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`cal-event-card ${ev.done ? 'is-done' : ''}`}
                >
                  <label className="cal-event-check" title="Segna come completato">
                    <input
                      type="checkbox"
                      checked={Boolean(ev.done)}
                      onChange={(e) => onToggleDone(ev, e.target.checked)}
                    />
                  </label>

                  <div className="cal-event-body">
                    <div className="cal-event-top">
                      <span className="cal-event-time">
                        {ev.time || 'Giornata'}
                      </span>
                      <span className="cal-event-title">
                        {ev.title || 'Appuntamento'}
                      </span>
                      {ev.client_name ? (
                        <span className="cal-event-client">· {ev.client_name}</span>
                      ) : null}
                    </div>

                    {ev.address || ev.phone ? (
                      <div className="cal-event-links">
                        {ev.address ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cal-link"
                          >
                            Apri su Maps: {ev.address}
                          </a>
                        ) : null}
                        {ev.phone ? (
                          <a
                            href={`tel:${ev.phone.replace(/\s+/g, '')}`}
                            className="cal-link"
                          >
                            Chiama: {ev.phone}
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {ev.notes ? (
                      <div className="cal-event-notes">{ev.notes}</div>
                    ) : null}
                  </div>

                  <div className="cal-event-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleEdit(ev)}
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => handleDelete(ev.id)}
                      title="Elimina impegno"
                      aria-label="Elimina impegno"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}