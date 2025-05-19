import { useState, useEffect } from 'react';

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

  const addReminder = () => {
    if (task.trim() === '') return;
    const newReminder = { task };
    if (showDateTime && reminderDate && reminderTime) {
      newReminder.date = reminderDate;
      newReminder.time = reminderTime;
    }
    setReminders(prev => {
      const updated = [newReminder, ...prev]; // Add new reminder to the top (stack format)
      try {
        localStorage.setItem('orbitly_reminders', JSON.stringify(updated));
        console.log('[Reminders] Saved to localStorage:', updated);
      } catch (e) {
        console.error('[Reminders] Failed to save reminders:', e);
      }
      return updated;
    });
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
    setReminders(prev => {
      const updated = prev.map((r, i) => {
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
      });
      try {
        localStorage.setItem('orbitly_reminders', JSON.stringify(updated));
        console.log('[Reminders] Saved to localStorage:', updated);
      } catch (e) {
        console.error('[Reminders] Failed to save reminders:', e);
      }
      return updated;
    });
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
    setReminders(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      try {
        localStorage.setItem('orbitly_reminders', JSON.stringify(updated));
        console.log('[Reminders] Saved to localStorage:', updated);
      } catch (e) {
        console.error('[Reminders] Failed to save reminders:', e);
      }
      return updated;
    });
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

  const dropdownStyle = {
    position: 'absolute',
    top: '110%',
    left: 0,
    background: '#181818',
    border: '1px solid #333',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    padding: '1rem',
    zIndex: 10,
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  };

  const editDropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    width: '100%',
    background: '#181818',
    border: '1px solid #333',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    padding: '1rem',
    zIndex: 10,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={styles.wrapper}>
      <h3>🪐 Reminders</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ color: '#eee', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.98em' }}>
          <input
            type="checkbox"
            checked={autoDelete}
            onChange={e => setAutoDelete(e.target.checked)}
            style={{ accentColor: '#71f7ff' }}
          />
          Auto-delete reminders after their time
        </label>
      </div>
      <div style={styles.inputRow}>
        <div style={{ ...styles.inputRow, position: 'relative' }}>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter a reminder..."
            style={styles.input}
          />
          <button onClick={addReminder} style={styles.button}>Add</button>
          <label style={{ color: '#eee', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={showDateTime}
              onChange={e => setShowDateTime(e.target.checked)}
              style={{ accentColor: '#71f7ff' }}
            />
            Date/Time
          </label>
          {showDateTime && (
            <div style={dropdownStyle}>
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
        </div>
      </div>
      <ul style={styles.list}>
        {reminders.map((item, index) => (
          <li key={index} style={{ ...styles.listItem, position: 'relative', marginBottom: 10, background: '#222', borderRadius: 6, padding: '0.7rem', fontSize: '1em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#aaa', fontSize: '0.85em' }}>{item.date && item.time ? new Date(item.date + 'T' + item.time).toLocaleString() : '\u2014'}</span>
              <div>
                <button onClick={() => startEdit(index)} style={{ background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.1em', cursor: 'pointer', padding: 0, marginRight: 8 }} title="Edit">✏️</button>
                <button onClick={() => deleteReminder(index)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
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
                  <button onClick={() => saveEdit(index)} style={{
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
                  <button onClick={cancelEdit} style={{
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
              <span style={{ color: '#eee', fontSize: '1.05em', whiteSpace: 'pre-wrap', display: 'block', marginTop: 4 }}>🔔 {item.task}</span>
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
