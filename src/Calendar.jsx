import { useState, useEffect, useRef } from 'react';
import calendarSoundFile from './assets/mixkit-correct-answer-tone-2870.wav';

function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState];
}

function getToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getMonthDays(year, month) {
  // month: 0-based
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function Calendar({ onClose }) {
  const today = getToday();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [events, setEvents] = useLocalStorageState('orbitly_calendar_events', {}); // <-- use custom hook
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventInput, setEventInput] = useState('');
  const [reminderChecked, setReminderChecked] = useState(false);
  const [notificationActive, setNotificationActive] = useState(false);
  const audioRef = useRef(null);
  const hapticIntervalRef = useRef(null);

  const days = getMonthDays(currentMonth.year, currentMonth.month);
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();
  const weeks = [];
  let week = Array(firstDayOfWeek).fill(null);
  days.forEach((date, i) => {
    week.push(date);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  const handleAddEvent = () => {
    if (!eventInput.trim()) return;
    setEvents(prev => {
      const updated = { ...prev };
      const prevEvents = prev[selectedDate] || [];
      updated[selectedDate] = [...prevEvents, { text: eventInput.trim(), reminder: reminderChecked }];
      return updated;
    });
    if (reminderChecked) scheduleEventNotifications(selectedDate, eventInput.trim());
    setEventInput('');
    setReminderChecked(false);
  };

  const handleDeleteEvent = (idx) => {
    setEvents(prev => {
      const updated = { ...prev };
      if (!updated[selectedDate]) return updated;
      updated[selectedDate] = updated[selectedDate].filter((_, i) => i !== idx);
      if (updated[selectedDate].length === 0) delete updated[selectedDate];
      return updated;
    });
  };

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleString('default', { month: 'long' });

  // On mount, reschedule notifications for all future events with reminders
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    Object.entries(events).forEach(([dateStr, evArr]) => {
      evArr.forEach(ev => {
        if (ev.reminder) scheduleEventNotifications(dateStr, ev.text);
      });
    });
  }, [events]);

  function playReminderSound() {
    if (notificationActive) return;
    setNotificationActive(true);
    const audio = new Audio(calendarSoundFile);
    audioRef.current = audio;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    audio.onloadedmetadata = () => {
      const len = audio.duration || 9;
      let elapsed = 0;
      hapticIntervalRef.current = setInterval(() => {
        if (navigator.vibrate) navigator.vibrate([50, 100]);
        elapsed += 0.5;
        if (elapsed >= len) {
          clearInterval(hapticIntervalRef.current);
          setNotificationActive(false);
        }
      }, 500);
      setTimeout(() => stopNotification(), len * 1000);
    };
    // Show popup immediately for user interaction
    setTimeout(() => {
      if (window.confirm('Calendar Event Reminder! Click OK to dismiss, or use Force Stop.')) {
        stopNotification();
      }
    }, 100);
  }

  function stopNotification() {
    setNotificationActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
    }
  }

  return (
    <div style={{ background: '#181818', borderRadius: 12, boxShadow: '0 0 8px #0ff2', color: '#eee', position: 'relative', padding: '2.5rem 1.5rem 1.5rem 1.5rem', margin: 0 }}>
      <h3 style={{ color: '#ffd9e3', marginBottom: 12, textAlign: 'center' }}>🗓️ Calendar</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
        <button onClick={() => { triggerHaptic(); setCurrentMonth(m => ({ year: m.month === 0 ? m.year - 1 : m.year, month: m.month === 0 ? 11 : m.month - 1 })); }} style={navBtnStyle}>&lt;</button>
        <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#71f7ff', textAlign: 'center', flex: 1 }}>{monthName} {currentMonth.year}</span>
        <button onClick={() => { triggerHaptic(); setCurrentMonth(m => ({ year: m.month === 11 ? m.year + 1 : m.year, month: m.month === 11 ? 0 : m.month + 1 })); }} style={navBtnStyle}>&gt;</button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#222',
              color: '#eee',
              border: 'none',
              borderRadius: 6,
              padding: '0.3rem 0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              zIndex: 2,
              fontSize: '1.1em',
            }}
            aria-label="Close calendar"
          >
            ✕
          </button>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, background: 'none' }}>
        <thead>
          <tr style={{ color: '#71f7ff', textAlign: 'center' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <th key={d} style={{ padding: 4, textAlign: 'center' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((date, j) => {
                if (!date) return <td key={j} style={{ padding: 4 }}></td>;
                const dateStr = date.toISOString().slice(0, 10);
                const hasEvent = !!events[dateStr];
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <td key={j} style={{ padding: 0, textAlign: 'center' }}>
                    <button
                      onClick={() => { triggerHaptic(); setSelectedDate(dateStr); }}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: 'none',
                        background: isSelected ? '#71f7ff' : isToday ? '#222' : '#181818',
                        color: isSelected ? '#181818' : hasEvent ? '#ffd9e3' : '#eee',
                        fontWeight: isToday ? 700 : 500,
                        boxShadow: hasEvent ? '0 0 6px #ffd9e3' : undefined,
                        outline: isSelected ? '2px solid #ffd9e3' : 'none',
                        margin: 2, cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                    >
                      {date.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#ffd9e3', fontWeight: 500, display: 'block', marginBottom: 4, textAlign: 'center' }}>Events for {selectedDate}:</span>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(events[selectedDate] || []).map((ev, idx) => (
            <li key={idx} style={{ background: '#222', borderRadius: 6, padding: '0.7rem', marginBottom: 10, fontSize: '1em', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#aaa', fontSize: '0.85em' }}>{selectedDate}</span>
                <button onClick={() => handleDeleteEvent(idx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
              </div>
              <span style={{ color: '#eee', fontSize: '1.05em', whiteSpace: 'pre-wrap' }}>{typeof ev === 'string' ? ev : ev.text}{ev.reminder ? <span style={{ color: '#71f7ff', marginLeft: 6, fontSize: '0.95em' }}>🔔</span> : null}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <input
          type="text"
          value={eventInput}
          onChange={e => setEventInput(e.target.value)}
          placeholder="Add event for selected day..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #222', background: '#222', color: '#eee', fontSize: '1rem' }}
        />
        <label style={{ color: '#eee', fontSize: '0.98em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={reminderChecked}
            onChange={e => setReminderChecked(e.target.checked)}
            style={{ accentColor: '#71f7ff' }}
          />
          Set reminder
        </label>
        <button onClick={handleAddEvent} style={{ ...navBtnStyle, background: '#71f7ff', color: '#181818', fontWeight: 600 }}>Add</button>
      </div>
      {notificationActive && (
        <button onClick={stopNotification} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: 12 }}>
          Force Stop Notification
        </button>
      )}
    </div>
  );
}

const navBtnStyle = {
  padding: '0.3rem 0.8rem',
  borderRadius: '6px',
  border: 'none',
  background: '#222',
  color: '#eee',
  fontWeight: 500,
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
  outline: 'none',
};

export default Calendar;
