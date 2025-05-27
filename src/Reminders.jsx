import { useState, useEffect, useRef } from 'react';
import standardSoundFile from './assets/mixkit-correct-answer-tone-2870.wav';
import aggressiveSoundFile from './assets/mixkit-urgent-simple-tone-loop-2976.wav';

function Reminders() {
  const [showDateTime, setShowDateTime] = useState(false);
  const [task, setTask] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminders, setReminders] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingTask, setEditingTask] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingShowDateTime, setEditingShowDateTime] = useState(false);
  const [autoDelete, setAutoDelete] = useState(() => {
    try {
      const stored = localStorage.getItem('orbitly_reminders_autodelete');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
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
  const previewAudioRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('orbitly_reminders');
      if (stored) {
        setReminders(JSON.parse(stored));
        console.log('[Reminders] Loaded from localStorage:', stored);
      }
    } catch (e) {
      setReminders([]);
      console.error('[Reminders] Failed to load reminders:', e);
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('orbitly_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.error('[Reminders] Failed to persist reminders:', e);
    }
  }, [reminders]);

  // Save notification mode
  useEffect(() => {
    try {
      localStorage.setItem('orbitly_notification_mode', notificationMode);
    } catch {}
  }, [notificationMode]);

  const addReminder = () => {
    if (task.trim() === '') return;
    const newReminder = { task };
    if (showDateTime && reminderDate && reminderTime) {
      newReminder.date = reminderDate;
      newReminder.time = reminderTime;
    }
    setReminders(prev => [newReminder, ...prev]); // Add new reminder to the top (stack format)
    setTask('');
    setReminderDate('');
    setReminderTime('');
    setShowDateTime(false);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditingTask(reminders[idx].task);
    setEditingDate(reminders[idx].date || '');
    setEditingTime(reminders[idx].time || '');
    setEditingShowDateTime(!!(reminders[idx].date && reminders[idx].time));
  };

  const saveEdit = (idx) => {
    setReminders(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updatedR = { ...r, task: editingTask };
      if (editingShowDateTime && editingDate && editingTime) {
        updatedR.date = editingDate;
        updatedR.time = editingTime;
      } else {
        delete updatedR.date;
        delete updatedR.time;
      }
      return updatedR;
    }));
    setEditingIdx(null);
    setEditingTask('');
    setEditingDate('');
    setEditingTime('');
    setEditingShowDateTime(false);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditingTask('');
    setEditingDate('');
    setEditingTime('');
    setEditingShowDateTime(false);
  };

  const deleteReminder = (idx) => {
    setReminders(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditingTask('');
      setEditingDate('');
      setEditingTime('');
      setEditingShowDateTime(false);
    }
  };

  // Auto-delete logic: filter reminders after load and on change if enabled
  useEffect(() => {
    if (!autoDelete) return;
    setReminders(prev => {
      const now = new Date();
      const filtered = prev.filter(rem => {
        if (rem.date && rem.time) {
          const dt = new Date(rem.date + 'T' + rem.time);
          return dt > now;
        }
        return true; // keep reminders without date/time
      });
      if (filtered.length !== prev.length) {
        try {
          localStorage.setItem('orbitly_reminders', JSON.stringify(filtered));
          console.log('[Reminders] Auto-deleted past reminders:', filtered);
        } catch (e) {
          console.error('[Reminders] Failed to save reminders:', e);
        }
      }
      // If all reminders are filtered out, return an empty array
      return filtered.length === 0 ? [] : filtered;
    });
  }, [autoDelete]); // Remove reminders.length from dependencies

  // Persist autoDelete preference
  useEffect(() => {
    try {
      localStorage.setItem('orbitly_reminders_autodelete', JSON.stringify(autoDelete));
    } catch {}
  }, [autoDelete]);

  // Helper to play reminder sound with haptic and popup
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
        // Fallback: if metadata never loads, stop after 9s
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

  // Helper to trigger haptic feedback
  function triggerHaptic() {
    if (navigator.vibrate) {
      navigator.vibrate([30, 30, 30]); // triple short pulse
    }
  }

  // Helper to schedule a notification for a reminder
  function scheduleReminderNotification(reminder, idx) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!reminder.date || !reminder.time) return;
    const dt = new Date(reminder.date + 'T' + reminder.time);
    const now = new Date();
    const timeout = dt - now;
    if (timeout > 0) {
      setTimeout(() => {
        new Notification('Orbitly Reminder', {
          body: reminder.task + (reminder.date && reminder.time ? ` (${new Date(reminder.date + 'T' + reminder.time).toLocaleString()})` : ''),
        });
        playReminderSound();
        triggerHaptic();
      }, timeout);
    }
  }

  // Helper to schedule a push notification for a reminder
  function schedulePushReminder(reminder) {
    if (!reminder.date || !reminder.time) return;
    const dt = new Date(reminder.date + 'T' + reminder.time);
    const now = new Date();
    const timeout = dt - now;
    if (timeout > 0) {
      setTimeout(() => {
        // Send push notification request to backend
        fetch('http://localhost:4000/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Orbitly Reminder',
            body: reminder.task + (reminder.date && reminder.time ? ` (${new Date(reminder.date + 'T' + reminder.time).toLocaleString()})` : ''),
            data: { reminder }
          })
        });
      }, timeout);
    }
  }

  // Reschedule notifications for all reminders with a future date/time
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    reminders.forEach((rem, idx) => {
      if (rem.date && rem.time) {
        const dt = new Date(rem.date + 'T' + rem.time);
        if (dt > new Date()) {
          scheduleReminderNotification(rem, idx);
          schedulePushReminder(rem);
        }
      }
    });
  }, [reminders]);

  // Helper to wrap a handler with haptic feedback
  function withHaptics(fn) {
    return (...args) => {
      triggerHaptic();
      fn(...args);
    };
  }

  // --- Sound preview for notification modes ---
  function previewSound(mode) {
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    let audio;
    if (mode === 'aggressive') {
      audio = new Audio(aggressiveSoundFile);
    } else {
      audio = new Audio(standardSoundFile);
    }
    previewAudioRef.current = audio;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    audio.onended = () => {
      if (previewAudioRef.current === audio) previewAudioRef.current = null;
    };
  }
  function stopPreviewSound() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
  }

  return (
    <div style={styles.wrapper}>
      <h3 style={{ paddingTop: 32, textAlign: 'left' }}>🪐 Reminders</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ color: '#eee', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.98em' }}>
          <input
            type="checkbox"
            checked={autoDelete}
            onChange={withHaptics(e => setAutoDelete(e.target.checked))}
            style={{ accentColor: '#71f7ff' }}
          />
          Auto-delete reminders after their time
        </label>
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
      <div style={styles.inputRow}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, width: '100%' }}>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter a reminder..."
            style={styles.input}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <label style={{ color: '#eee', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.98em' }}>
              <input
                type="checkbox"
                checked={showDateTime}
                onChange={withHaptics(e => setShowDateTime(e.target.checked))}
                style={{ accentColor: '#71f7ff' }}
              />
              Date/Time
            </label>
          </div>
          {showDateTime && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                style={styles.input}
              />
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={styles.input}
              />
            </div>
          )}
          <button onClick={withHaptics(addReminder)} style={{ ...styles.button, marginTop: 8, alignSelf: 'flex-end' }}>Add</button>
        </div>
      </div>
      <ul style={styles.list}>
        {reminders.map((item, index) => (
          <li key={index} style={{ ...styles.listItem, position: 'relative', marginBottom: 10, background: '#222', borderRadius: 6, padding: '0.7rem', fontSize: '1em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#aaa', fontSize: '0.85em' }}>{item.date && item.time ? new Date(item.date + 'T' + item.time).toLocaleString() : '\u2014'}</span>
              <div>
                <button onClick={withHaptics(() => startEdit(index))} style={{ background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.1em', cursor: 'pointer', padding: 0, marginRight: 8 }} title="Edit">✏️</button>
                <button onClick={withHaptics(() => deleteReminder(index))} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
              </div>
            </div>
            {editingIdx === index ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  value={editingTask}
                  onChange={e => setEditingTask(e.target.value)}
                  placeholder="Edit reminder"
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
                {editingShowDateTime && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={e => setEditingDate(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <input
                      type="time"
                      value={editingTime}
                      onChange={e => setEditingTime(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button onClick={withHaptics(() => saveEdit(index))} style={{
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
                  <button onClick={withHaptics(cancelEdit)} style={{
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
              <span style={{ color: '#eee', fontSize: '1.05em', whiteSpace: 'pre-wrap', display: 'block', marginTop: 4, textAlign: 'left' }}>🔔 {item.task}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  wrapper: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif',
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  input: {
    flexGrow: 1,
    padding: '0.5rem',
    fontSize: '1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    background: '#222',
    color: '#eee',
    padding: '0.5rem',
    borderRadius: '4px',
    marginBottom: '0.5rem',
  },
};

export default Reminders;
