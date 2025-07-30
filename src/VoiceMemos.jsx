import { useState, useRef } from 'react';
import Journal from './Journal';

function VoiceMemos() {
  const [recording, setRecording] = useState(false);
  // Robust localStorage load for memos
  const [memos, setMemos] = useState(() => {
    try {
      const stored = localStorage.getItem('orbitly_voice_memos');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Corrupted data');
      return parsed;
    } catch (e) {
      localStorage.removeItem('orbitly_voice_memos');
      window.alert('Your voice memos data was lost or deleted. This may be due to browser settings, incognito mode, or clearing site data. For best results, use Orbitly in regular mode and avoid clearing site data.');
      return [];
    }
  });
  const [audioURL, setAudioURL] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingName, setEditingName] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert blob to base64 data URL for persistence
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          setAudioURL(base64data);
          const newMemo = { url: base64data, date: new Date().toISOString(), name: 'Voice Memo' };
          setMemos(prev => {
            const updated = [newMemo, ...prev];
            // Robust localStorage save for memos
            try {
              localStorage.setItem('orbitly_voice_memos', JSON.stringify(updated));
            } catch (e) {
              alert('Failed to save voice memos. Local storage may be full or unavailable.');
            }
            return updated;
          });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const deleteMemo = (idx) => {
    const updated = memos.filter((_, i) => i !== idx);
    setMemos(updated);
    // Robust localStorage save for memos
    try {
      localStorage.setItem('orbitly_voice_memos', JSON.stringify(updated));
    } catch (e) {
      alert('Failed to save voice memos. Local storage may be full or unavailable.');
    }
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditingName(memos[idx].name || '');
  };

  const saveEdit = (idx) => {
    const updated = memos.map((m, i) => i === idx ? { ...m, name: editingName || 'Voice Memo' } : m);
    setMemos(updated);
    // Robust localStorage save for memos
    try {
      localStorage.setItem('orbitly_voice_memos', JSON.stringify(updated));
    } catch (e) {
      alert('Failed to save voice memos. Local storage may be full or unavailable.');
    }
    setEditingIdx(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditingName('');
  };

  return (
    <div style={{ background: '#181818', borderRadius: 10, boxShadow: '0 0 4px #0ff2', color: '#eee', padding: '1rem', marginBottom: '1rem', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', paddingTop: 32 }}>
      <h3 style={{ color: '#ffd9e3', textAlign: 'center', marginBottom: 10, fontSize: '1.1rem' }}>🎤 Voice Memos</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        <button onClick={recording ? stopRecording : startRecording} style={{
          background: recording ? '#ff6b6b' : '#71f7ff',
          color: '#181818',
          border: 'none',
          borderRadius: 6,
          padding: '0.4rem 1rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: 'pointer',
          boxShadow: recording ? '0 0 4px #ff6b6b' : '0 0 4px #71f7ff',
          transition: 'background 0.2s, color 0.2s',
        }}>
          {recording ? 'Stop Recording' : 'Record Memo'}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {memos.length === 0 && <li style={{ color: '#888', textAlign: 'center', fontSize: '0.95em' }}>No voice memos yet.</li>}
        {memos.map((memo, idx) => (
          <li key={memo.url} style={{ background: '#222', borderRadius: 6, padding: '0.7rem', marginBottom: 10, fontSize: '1em', position: 'relative', minHeight: 38 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#aaa', fontSize: '0.85em' }}>{new Date(memo.date).toLocaleString()}</span>
              <div>
                <button onClick={() => startEdit(idx)} style={{ background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.1em', cursor: 'pointer', padding: 0, marginRight: 8 }} title="Edit">✏️</button>
                <button onClick={() => deleteMemo(idx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
              </div>
            </div>
            {editingIdx === idx ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Memo name"
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => saveEdit(idx)} style={{
                    background: '#71f7ff',
                    color: '#181818',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.4rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}>
                    Save
                  </button>
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
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => {
                  try {
                    const audio = document.getElementById(`audio-memo-${idx}`);
                    if (audio) {
                      audio.currentTime = 0;
                      const playPromise = audio.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                      }
                    }
                  } catch (e) {
                    // fail silently
                  }
                }}
                  style={{ background: 'none', border: 'none', color: '#71f7ff', fontSize: '1.2em', marginRight: 4, cursor: 'pointer', padding: 0 }}
                  title="Play">
                  ▶️
                </button>
                <strong style={{ color: '#71f7ff', fontSize: '1.1em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{memo.name || 'Voice Memo'}</strong>
                <audio id={`audio-memo-${idx}`} src={memo.url} style={{ width: '100%', marginTop: 4 }} controls={false} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VoiceMemos;

// Add the Journal section below VoiceMemos in your main app (e.g., App.jsx):
// <VoiceMemos />
// <Journal />
