import { useState, useEffect, useRef } from 'react';
import standardSoundFile from './assets/mixkit-correct-answer-tone-2870.wav';
import aggressiveSoundFile from './assets/mixkit-urgent-simple-tone-loop-2976.wav';

function Schedule({ onClose }) {
  const [daily, setDaily] = useState([]); // Array of daily entries
  const [weekly, setWeekly] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  const [view, setView] = useState('daily');
  const [dailyInput, setDailyInput] = useState({ task: '', time: '' });
  const [weeklyInputs, setWeeklyInputs] = useState({
    Monday: { task: '', time: '', date: '' }, Tuesday: { task: '', time: '', date: '' }, Wednesday: { task: '', time: '', date: '' }, Thursday: { task: '', time: '', date: '' }, Friday: { task: '', time: '', date: '' }, Saturday: { task: '', time: '', date: '' }, Sunday: { task: '', time: '', date: '' }
  });
  const [editingDaily, setEditingDaily] = useState({ idx: null, task: '', time: '' });
  const [editingWeekly, setEditingWeekly] = useState({ day: null, idx: null, task: '', time: '', date: '' });
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklyReminders, setWeeklyReminders] = useState({
    Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false
  });
  const [notificationMode, setNotificationMode] = useState(() => {
    try {
      return localStorage.getItem('orbitly_notification_mode') || 'standard';
    } catch {
      return 'standard';
    }
  });
  const [notificationActive, setNotificationActive] = useState(false);
  const audioRef = useRef(null);
  const hapticIntervalRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    const d = localStorage.getItem('orbitly_daily');
    const w = localStorage.getItem('orbitly_weekly');
    if (d) {
      try {
        const parsed = JSON.parse(d);
        setDaily(Array.isArray(parsed) ? parsed : []);
      } catch {
        setDaily([]);
      }
    }
    if (w) {
      try {
        const parsed = JSON.parse(w);
        if (
          parsed && typeof parsed === 'object' &&
          Object.keys(parsed).every(day => Array.isArray(parsed[day]))
        ) {
          setWeekly(parsed);
        } else {
          setWeekly({
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
          });
        }
      } catch {
        setWeekly({
          Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        });
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('orbitly_notification_mode', notificationMode);
    } catch {}
  }, [notificationMode]);

  // Play reminder sound
  function playReminderSound() {
    if (notificationActive) return;
    setNotificationActive(true);
    let audio, duration;
    if (notificationMode === 'aggressive') {
      audio = new Audio(aggressiveSoundFile);
      duration = 9000;
    } else {
      audio = new Audio(standardSoundFile);
      duration = null; // Use audio duration
    }
    audioRef.current = audio;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    // Haptic feedback
    if (notificationMode === 'aggressive') {
      let elapsed = 0;
      hapticIntervalRef.current = setInterval(() => {
        if (navigator.vibrate) navigator.vibrate([50, 100]);
        elapsed += 0.5;
        if (elapsed >= 9) {
          clearInterval(hapticIntervalRef.current);
          setNotificationActive(false);
        }
      }, 500);
      setTimeout(() => stopNotification(), 9000);
    } else {
      // Standard: haptic for audio duration, fallback to 9s if metadata fails
      const startHaptic = (len) => {
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
      if (audio.readyState >= 1 && audio.duration) {
        startHaptic(audio.duration);
      } else {
        audio.onloadedmetadata = () => {
          startHaptic(audio.duration || 9);
        };
        setTimeout(() => stopNotification(), 9000);
      }
    }
    // Show popup immediately for user interaction
    setTimeout(() => {
      if (window.confirm('Reminder! Click OK to dismiss, or use Force Stop.')) {
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

  // Schedule task notifications
  function scheduleTaskNotifications(dateStr, timeStr, taskText, isDaily) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let baseDate;
    if (isDaily) {
      // Use today for daily tasks
      const today = new Date();
      const [h, m] = timeStr.split(':');
      baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
    } else {
      // Weekly: use dateStr and timeStr
      baseDate = new Date(dateStr + 'T' + timeStr);
    }
    const now = new Date();
    let notifyTimes;
    if (isDaily) {
      notifyTimes = [5, 3, 1, 0].map(h => h * 60 * 60 * 1000); // 5h, 3h, 1h, at time
    } else {
      notifyTimes = [7, 3, 1, 0].map(d => d * 24 * 60 * 60 * 1000); // 7d, 3d, 1d, at time
    }
    notifyTimes.forEach(msBefore => {
      const notifyAt = new Date(baseDate.getTime() - msBefore);
      const timeout = notifyAt - now;
      if (timeout > 0) {
        setTimeout(() => {
          new Notification('Orbitly Task Reminder', { body: `${taskText} (${isDaily ? timeStr : dateStr + ' ' + timeStr})` });
          playReminderSound();
        }, timeout);
      }
    });
  }

  // Add daily entry
  const addDailyEntry = () => {
    const { task, time } = dailyInput;
    if (!task.trim()) return;
    setDaily(prev => {
      const updated = [...prev, { task, time: time || '', reminder: dailyReminder }];
      localStorage.setItem('orbitly_daily', JSON.stringify(updated));
      return updated;
    });
    if (dailyReminder && time) scheduleTaskNotifications('', time, dailyInput.task, true);
    setDailyInput({ task: '', time: '' });
    setDailyReminder(false);
  };

  // Add weekly entry
  const addWeeklyEntry = (day) => {
    const { task, time, date } = weeklyInputs[day];
    if (!task.trim() || !time || !date) return;
    setWeekly(prev => {
      const updated = {
        ...prev,
        [day]: [...prev[day], { task, time, date, reminder: weeklyReminders[day] }]
      };
      localStorage.setItem('orbitly_weekly', JSON.stringify(updated));
      return updated;
    });
    if (weeklyReminders[day]) scheduleTaskNotifications(date, time, weeklyInputs[day].task, false);
    setWeeklyInputs(prev => ({ ...prev, [day]: { task: '', time: '', date: '' } }));
    setWeeklyReminders(prev => ({ ...prev, [day]: false }));
  };

  // Edit daily entry
  const editDailyEntry = (idx, newTask, newTime) => {
    setDaily(prev => {
      const updated = prev.map((entry, i) =>
        i === idx ? { ...entry, task: newTask, time: newTime } : entry
      );
      localStorage.setItem('orbitly_daily', JSON.stringify(updated));
      return updated;
    });
    setEditingDaily({ idx: null, task: '', time: '' });
  };

  // Edit weekly entry
  const editWeeklyEntry = (day, idx, newTask, newTime, newDate) => {
    setWeekly(prev => {
      const updated = {
        ...prev,
        [day]: prev[day].map((entry, i) =>
          i === idx ? { ...entry, task: newTask, time: newTime, date: newDate } : entry
        )
      };
      localStorage.setItem('orbitly_weekly', JSON.stringify(updated));
      return updated;
    });
    setEditingWeekly({ day: null, idx: null, task: '', time: '', date: '' });
  };

  // Delete daily entry
  const deleteDailyEntry = (idx) => {
    setDaily(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      localStorage.setItem('orbitly_daily', JSON.stringify(updated));
      return updated;
    });
    if (editingDaily.idx === idx) {
      setEditingDaily({ idx: null, task: '', time: '' });
    }
  };

  // Delete weekly entry
  const deleteWeeklyEntry = (day, idx) => {
    setWeekly(prev => {
      const updated = {
        ...prev,
        [day]: prev[day].filter((_, i) => i !== idx)
      };
      localStorage.setItem('orbitly_weekly', JSON.stringify(updated));
      return updated;
    });
    if (editingWeekly.day === day && editingWeekly.idx === idx) {
      setEditingWeekly({ day: null, idx: null, task: '', time: '', date: '' });
    }
  };

  // On mount, reschedule notifications for all future tasks with reminders
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    daily.forEach(entry => {
      if (entry.reminder) scheduleTaskNotifications('', entry.time, entry.task, true);
    });
    Object.entries(weekly).forEach(([day, arr]) => {
      arr.forEach(entry => {
        if (entry.reminder) scheduleTaskNotifications(entry.date, entry.time, entry.task, false);
      });
    });
  }, [daily, weekly]);

  // --- Sound preview for notification modes ---
  function previewSound(mode) {
    let audio;
    if (mode === 'aggressive') {
      audio = new Audio(aggressiveSoundFile);
    } else {
      audio = new Audio(standardSoundFile);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  return (
    <div style={{ position: 'relative', background: '#181818', borderRadius: 8, padding: '1.5rem', boxShadow: '0 0 8px #0ff2', color: '#eee', paddingTop: 32 }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
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
          aria-label="Close schedules"
        >
          ✕
        </button>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setView('daily')}
          style={{ ...buttonStyle, background: view === 'daily' ? '#222' : '#181818', color: view === 'daily' ? '#71f7ff' : '#eee' }}
        >
          Daily
        </button>
        <button
          onClick={() => setView('weekly')}
          style={{ ...buttonStyle, background: view === 'weekly' ? '#222' : '#181818', color: view === 'weekly' ? '#71f7ff' : '#eee' }}
        >
          Weekly
        </button>
      </div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ color: '#eee', fontSize: '0.98em', marginRight: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>Notification Mode:</span>
          <select 
            value={notificationMode} 
            onChange={e => {
              setNotificationMode(e.target.value);
              // Play sound immediately on change
              let audio;
              if (e.target.value === 'aggressive') {
                audio = new Audio(aggressiveSoundFile);
                audio.currentTime = 0;
                audio.play().catch(() => {});
                setTimeout(() => {
                  audio.pause();
                  audio.currentTime = 0;
                }, 1300); // Play aggressive sound for 1.3 seconds only
              } else {
                audio = new Audio(standardSoundFile);
                audio.currentTime = 0;
                audio.play().catch(() => {});
              }
            }} 
            style={{
              background: '#181818',
              color: '#71f7ff',
              border: '1px solid #333',
              borderRadius: 6,
              padding: '0.3em 1.2em 0.3em 0.7em',
              fontSize: '1em',
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 0 4px #0ff2',
              appearance: 'none',
              minWidth: 110,
              transition: 'border 0.2s, box-shadow 0.2s',
            }}
          >
            <option value="standard">Standard</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>
        {notificationActive && (
          <button onClick={stopNotification} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginLeft: 8 }}>Force Stop</button>
        )}
      </div>
      {view === 'daily' ? (
        <div>
          <h3 style={{ color: '#71f7ff', marginBottom: '1rem' }}>🗓️ Daily Schedule</h3>
          <div style={{ marginBottom: '1.5rem', background: '#181818', borderRadius: 8, padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={dailyInput.task}
                onChange={e => setDailyInput(prev => ({ ...prev, task: e.target.value }))}
                placeholder="Task for today"
                style={{ ...inputStyle, flex: 2, minWidth: 0 }}
              />
              <input
                type="time"
                value={dailyInput.time}
                onChange={e => setDailyInput(prev => ({ ...prev, time: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
              <span style={{ color: '#888', fontSize: '0.92em', marginLeft: 2 }}>(optional)</span>
              <label style={{ color: '#eee', fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                <input
                  type="checkbox"
                  checked={dailyReminder}
                  onChange={e => setDailyReminder(e.target.checked)}
                  style={{ accentColor: '#71f7ff', marginRight: 4 }}
                  disabled={!dailyInput.time}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Remind me</span>
              </label>
              <button onClick={addDailyEntry} style={buttonStyle}>Add</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {daily.map((entry, idx) => (
                <li key={idx} style={{ color: '#eee', background: '#222', borderRadius: 6, margin: '0.25rem 0', padding: '0.7rem', position: 'relative', fontSize: '1em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#aaa', fontSize: '0.85em' }}>{entry.time ? entry.time : <span style={{ color: '#888', fontStyle: 'italic' }}>No time</span>}</span>
                    <div>
                      <button onClick={() => setEditingDaily({ idx, task: entry.task, time: entry.time })} style={{ background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.1em', cursor: 'pointer', padding: 0, marginRight: 8 }} title="Edit">✏️</button>
                      <button onClick={() => deleteDailyEntry(idx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
                    </div>
                  </div>
                  {editingDaily.idx === idx ? (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        type="text"
                        value={editingDaily.task}
                        onChange={e => setEditingDaily(prev => ({ ...prev, task: e.target.value }))}
                        placeholder="Edit task"
                        style={{
                          padding: '0.4rem',
                          borderRadius: 6,
                          border: '1px solid #333',
                          background: '#111',
                          color: '#eee',
                          fontSize: '0.95em',
                          outline: 'none',
                          transition: 'border 0.2s',
                        }}
                      />
                      <input
                        type="time"
                        value={editingDaily.time}
                        onChange={e => setEditingDaily(prev => ({ ...prev, time: e.target.value }))}
                        style={{
                          padding: '0.4rem',
                          borderRadius: 6,
                          border: '1px solid #333',
                          background: '#111',
                          color: '#eee',
                          fontSize: '0.95em',
                          outline: 'none',
                          transition: 'border 0.2s',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        <button onClick={() => editDailyEntry(editingDaily.idx, editingDaily.task, editingDaily.time)} style={{
                          background: '#71f7ff',
                          color: '#181818',
                          border: 'none',
                          borderRadius: 6,
                          padding: '0.4rem 1rem',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}>Save</button>
                        <button onClick={() => setEditingDaily({ idx: null, task: '', time: '' })} style={{
                          background: 'none',
                          border: '1px solid #333',
                          color: '#ffd9e3',
                          borderRadius: 6,
                          padding: '0.4rem 1rem',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontWeight: 500 }}>{entry.reminder ? <span style={{ color: '#71f7ff', marginRight: 8, fontSize: '1.1em' }}>🔔</span> : null}{entry.task}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ color: '#71f7ff', marginBottom: '1rem' }}>📅 Weekly Schedule</h3>
          {Object.keys(weekly).map((day) => (
            <div key={day} style={{ marginBottom: '1.5rem', background: '#181818', borderRadius: 8, padding: '1rem' }}>
              <label style={{ color: '#eee', fontWeight: 500 }}>{day}</label>
              <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={weeklyInputs[day].task}
                  onChange={e => setWeeklyInputs(prev => ({ ...prev, [day]: { ...prev[day], task: e.target.value } }))}
                  placeholder={`Task for ${day}`}
                  style={inputStyle}
                />
                <input
                  type="time"
                  value={weeklyInputs[day].time}
                  onChange={e => setWeeklyInputs(prev => ({ ...prev, [day]: { ...prev[day], time: e.target.value } }))}
                  style={inputStyle}
                />
                <input
                  type="date"
                  value={weeklyInputs[day].date}
                  onChange={e => setWeeklyInputs(prev => ({ ...prev, [day]: { ...prev[day], date: e.target.value } }))}
                  style={inputStyle}
                />
                <label style={{ color: '#eee', fontSize: '0.98em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={weeklyReminders[day]}
                    onChange={e => setWeeklyReminders(prev => ({ ...prev, [day]: e.target.checked }))}
                    style={{ accentColor: '#71f7ff' }}
                    disabled={!weeklyInputs[day].date || !weeklyInputs[day].time}
                  />
                  Set reminder
                </label>
                <button onClick={() => addWeeklyEntry(day)} style={buttonStyle}>Add</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {weekly[day].map((entry, idx) => (
                  <li key={idx} style={{ color: '#eee', background: '#222', borderRadius: 6, margin: '0.25rem 0', padding: '0.7rem', position: 'relative', fontSize: '1em' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: '#aaa', fontSize: '0.85em' }}>{entry.date} {entry.time}</span>
                      <div>
                        <button onClick={() => setEditingWeekly({ day, idx, task: entry.task, time: entry.time, date: entry.date })} style={{ background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.1em', cursor: 'pointer', padding: 0, marginRight: 8 }} title="Edit">✏️</button>
                        <button onClick={() => deleteWeeklyEntry(day, idx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
                      </div>
                    </div>
                    {editingWeekly.day === day && editingWeekly.idx === idx ? (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          type="text"
                          value={editingWeekly.task}
                          onChange={e => setEditingWeekly(prev => ({ ...prev, task: e.target.value }))}
                          placeholder="Edit task"
                          style={{
                            padding: '0.4rem',
                            borderRadius: 6,
                            border: '1px solid #333',
                            background: '#111',
                            color: '#eee',
                            fontSize: '0.95em',
                            outline: 'none',
                            transition: 'border 0.2s',
                          }}
                        />
                        <input
                          type="time"
                          value={editingWeekly.time}
                          onChange={e => setEditingWeekly(prev => ({ ...prev, time: e.target.value }))}
                          style={{
                            padding: '0.4rem',
                            borderRadius: 6,
                            border: '1px solid #333',
                            background: '#111',
                            color: '#eee',
                            fontSize: '0.95em',
                            outline: 'none',
                            transition: 'border 0.2s',
                          }}
                        />
                        <input
                          type="date"
                          value={editingWeekly.date}
                          onChange={e => setEditingWeekly(prev => ({ ...prev, date: e.target.value }))}
                          style={{
                            padding: '0.4rem',
                            borderRadius: 6,
                            border: '1px solid #333',
                            background: '#111',
                            color: '#eee',
                            fontSize: '0.95em',
                            outline: 'none',
                            transition: 'border 0.2s',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                          <button onClick={() => editWeeklyEntry(editingWeekly.day, editingWeekly.idx, editingWeekly.task, editingWeekly.time, editingWeekly.date)} style={{
                            background: '#71f7ff',
                            color: '#181818',
                            border: 'none',
                            borderRadius: 6,
                            padding: '0.4rem 1rem',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}>Save</button>
                          <button onClick={() => setEditingWeekly({ day: null, idx: null, task: '', time: '', date: '' })} style={{
                            background: 'none',
                            border: '1px solid #333',
                            color: '#ffd9e3',
                            borderRadius: 6,
                            padding: '0.4rem 1rem',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 500 }}>{entry.reminder ? <span style={{ color: '#71f7ff', marginLeft: 6, fontSize: '1.1em' }}>🔔</span> : null}{entry.task}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: '0.5rem 1.2rem',
  borderRadius: '8px',
  border: 'none',
  background: '#181818',
  color: '#eee',
  fontWeight: 500,
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
  outline: 'none',
};

const inputStyle = {
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid #222',
  background: '#222',
  color: '#eee',
  fontSize: '1rem',
  minWidth: '90px',
};

const editButtonStyle = {
  marginLeft: '0.5rem',
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  border: 'none',
  background: '#333',
  color: '#71f7ff',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
  outline: 'none',
};

export default Schedule;
