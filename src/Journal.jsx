import { useState, useRef, useEffect } from 'react';

function Journal() {
  // Robust localStorage load
  const [entries, setEntries] = useState(() => {
    try {
      const stored = localStorage.getItem('orbitly_journal_entries');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Corrupted data');
      return parsed;
    } catch (e) {
      localStorage.removeItem('orbitly_journal_entries');
      return [];
    }
  });
  const [text, setText] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
  const [showRecordPopup, setShowRecordPopup] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [viewer, setViewer] = useState({ open: false, type: '', data: '', name: '' });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Robust localStorage save
  const saveEntries = (newEntries) => {
    setEntries(newEntries);
    try {
      localStorage.setItem('orbitly_journal_entries', JSON.stringify(newEntries));
    } catch (e) {
      alert('Failed to save journal entries. Local storage may be full or unavailable.');
    }
  };

  // Attachment popup logic
  const handleAttachmentType = (type) => {
    setShowAttachmentPopup(false);
    if (type === 'image') {
      document.getElementById('journal-attachment-input').click();
    } else if (type === 'audio') {
      setShowRecordPopup(true);
    }
  };

  // File input handler
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];
    const newPreviews = [];
    let filesProcessed = 0;
    files.forEach(file => {
      // Only allow image, audio, or video
      if (!(file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
        filesProcessed++;
        if (filesProcessed === files.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
          setAttachmentPreviews(prev => [...prev, ...newPreviews]);
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        newAttachments.push({
          name: file.name,
          type: file.type,
          data: ev.target.result,
        });
        if (file.type.startsWith('image/')) {
          newPreviews.push({ type: 'image', data: ev.target.result, name: file.name });
        } else if (file.type.startsWith('audio/')) {
          newPreviews.push({ type: 'audio', data: ev.target.result, name: file.name });
        } else if (file.type.startsWith('video/')) {
          newPreviews.push({ type: 'video', data: ev.target.result, name: file.name });
        }
        filesProcessed++;
        if (filesProcessed === files.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
          setAttachmentPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Audio recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
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

  const saveAudioAttachment = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments(prev => [...prev, {
          name: `Recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
          type: 'audio/webm',
          data: ev.target.result,
        }]);
        setAttachmentPreviews(prev => [...prev, {
          type: 'audio',
          data: ev.target.result,
          name: `Recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
        }]);
        setShowRecordPopup(false);
        setAudioBlob(null);
        setAudioURL(null);
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const addEntry = () => {
    if (text.trim() || attachments.length > 0) {
      const newEntry = {
        text: text.trim(),
        date: new Date().toISOString(),
        attachments: attachments,
      };
      const updated = [newEntry, ...entries];
      saveEntries(updated);
      setText('');
      setAttachments([]);
      setAttachmentPreviews([]);
    }
  };

  const deleteEntry = (idx) => {
    const updated = entries.filter((_, i) => i !== idx);
    saveEntries(updated);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditingText(entries[idx].text);
  };

  const saveEdit = (idx) => {
    const updated = entries.map((e, i) => i === idx ? { ...e, text: editingText } : e);
    saveEntries(updated);
    setEditingIdx(null);

    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditingText('');
  };

  // PWA install prompt logic
  useEffect(() => {
    // Only show install prompt if not running as a standalone/native app
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return;
    }
    let deferredPrompt = null;
    function beforeInstallHandler(e) {
      e.preventDefault();
      deferredPrompt = e;
      window.orbitlyShowInstall = () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
          });
        }
      };
      // Optionally, show a custom install button in your UI
      window.dispatchEvent(new CustomEvent('orbitly-install-available'));
    }
    window.addEventListener('beforeinstallprompt', beforeInstallHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
    };
  }, []);

  return (
    <div style={{ background: '#181818', borderRadius: 10, boxShadow: '0 0 4px #0ff2', color: '#eee', padding: '1rem', marginBottom: '1rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', position: 'relative', paddingTop: 32 }}>
      <h3 style={{ color: '#ffd9e3', textAlign: 'center', marginBottom: 10, fontSize: '1.1rem' }}>🪐 Journal</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <button onClick={() => setShowAttachmentPopup(true)} style={{ background: 'none', border: 'none', color: '#71f7ff', fontSize: '1.6em', padding: 0, marginRight: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add attachment">
          <span role="img" aria-label="Attachment">📎</span>
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a new journal entry..."
          rows={3}
          style={{ borderRadius: 20, border: '1px solid #333', background: '#111', color: '#eee', fontSize: '1em', padding: '0.6rem 1rem', resize: 'vertical', minHeight: 48, maxHeight: 120, flex: 1, boxSizing: 'border-box', margin: 0 }}
        />
        <button onClick={addEntry} style={{ background: '#71f7ff', color: '#181818', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 4px #71f7ff', marginLeft: 8 }} title="Add">
          <span role="img" aria-label="Send">➤</span>
        </button>
        <input id="journal-attachment-input" type="file" multiple accept="image/*,audio/*,video/*" style={{ display: 'none' }} onChange={handleAttachmentChange} />
      </div>
      {/* Centered attachment type selector over the main box */}
      {showAttachmentPopup && (
        <div style={{
          position: 'absolute',
          left: 12,
          bottom: 60,
          background: '#23272b',
          borderRadius: 16,
          boxShadow: '0 2px 16px #0008',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          alignItems: 'flex-start',
          zIndex: 20,
          minWidth: 160,
          border: '1px solid #333',
        }}>
          <button onClick={() => handleAttachmentType('image')} style={{
            background: 'none',
            border: 'none',
            color: '#71f7ff',
            fontSize: '1.15em',
            padding: '10px 18px',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}>
            <span role="img" aria-label="Image">🖼️</span> Image
          </button>
          <button onClick={() => handleAttachmentType('audio')} style={{
            background: 'none',
            border: 'none',
            color: '#71f7ff',
            fontSize: '1.15em',
            padding: '10px 18px',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}>
            <span role="img" aria-label="Audio">🎤</span> Record Audio
          </button>
          <button onClick={() => setShowAttachmentPopup(false)} style={{
            background: 'none',
            border: 'none',
            color: '#ffd9e3',
            fontSize: '1.1em',
            padding: '10px 18px',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            cursor: 'pointer',
            marginTop: 2,
            transition: 'background 0.2s',
          }}>
            <span role="img" aria-label="Cancel">❌</span> Cancel
          </button>
        </div>
      )}
      {/* Centered audio recorder over the main box */}
      {showRecordPopup && (
        <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translate(-50%, 20px)', width: 260, background: '#222', borderRadius: 10, padding: 18, boxShadow: '0 0 8px #0ff2', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', zIndex: 10 }}>
          <span style={{ color: '#ffd9e3', fontWeight: 600, fontSize: '1.1em' }}>Record Audio</span>
          {!recording && !audioURL && (
            <button onClick={startRecording} style={{ background: '#71f7ff', color: '#181818', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, fontSize: '1em', cursor: 'pointer', width: '100%' }}>Start Recording</button>
          )}
          {recording && (
            <button onClick={stopRecording} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, fontSize: '1em', cursor: 'pointer', width: '100%' }}>Stop Recording</button>
          )}
          {audioURL && !recording && (
            <>
              <audio src={audioURL} controls style={{ width: 200 }} />
              <button onClick={saveAudioAttachment} style={{ background: '#71f7ff', color: '#181818', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, fontSize: '1em', cursor: 'pointer', width: '100%' }}>Save Audio</button>
              <button onClick={() => { setShowRecordPopup(false); setAudioBlob(null); setAudioURL(null); }} style={{ background: 'none', color: '#ffd9e3', border: '1px solid #ffd9e3', borderRadius: 6, padding: '0.4rem 1.2rem', fontWeight: 600, fontSize: '1em', cursor: 'pointer', marginTop: 8, width: '100%' }}>Cancel</button>
            </>
          )}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {attachmentPreviews.map((att, i) => (
          att.type === 'image' ? (
            <img key={i} src={att.data} alt={att.name} style={{ maxWidth: 80, maxHeight: 80, borderRadius: 6 }} />
          ) : att.type === 'audio' ? (
            <audio key={i} src={att.data} controls style={{ maxWidth: 120 }} />
          ) : att.type === 'video' ? (
            <video key={i} src={att.data} controls style={{ maxWidth: 120, borderRadius: 6 }} />
          ) : null
        ))}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {entries.length === 0 && <li style={{ color: '#888', textAlign: 'center', fontSize: '0.95em' }}>No journal entries yet.</li>}
        {entries.map((entry, idx) => (
          <li key={entry.date} style={{ background: '#222', borderRadius: 6, padding: '0.7rem', marginBottom: 10, fontSize: '1em', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#aaa', fontSize: '0.85em' }}>{new Date(entry.date).toLocaleString()}</span>
              <div>
                <button onClick={() => startEdit(idx)} style={{ background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.1em', cursor: 'pointer', padding: 0, marginRight: 8 }} title="Edit">✏️</button>
                <button onClick={() => deleteEntry(idx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.1em', cursor: 'pointer', padding: 0 }} title="Delete">🗑️</button>
              </div>
            </div>
            {entry.attachments && entry.attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {entry.attachments.map((att, i) => (
                  att.type.startsWith('image/') ? (
                    <img key={i} src={att.data} alt={att.name} style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, cursor: 'pointer' }} onClick={() => setViewer({ open: true, type: att.type, data: att.data, name: att.name })} />
                  ) : att.type.startsWith('audio/') ? (
                    <audio key={i} src={att.data} controls style={{ maxWidth: 140 }} />
                  ) : att.type.startsWith('video/') ? (
                    <video key={i} src={att.data} controls style={{ maxWidth: 140, borderRadius: 6, cursor: 'pointer' }} onClick={() => setViewer({ open: true, type: att.type, data: att.data, name: att.name })} />
                  ) : null
                ))}
              </div>
            )}
            {editingIdx === idx ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  rows={3}
                  style={{ borderRadius: 6, border: '1px solid #333', background: '#111', color: '#eee', fontSize: '1em', padding: '0.6rem', resize: 'vertical', minHeight: 60 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => saveEdit(idx)} style={{ background: '#71f7ff', color: '#181818', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Save</button>
                  <button onClick={cancelEdit} style={{ background: 'none', border: '1px solid #333', color: '#ffd9e3', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', color: '#eee', fontSize: '1.05em' }}>{entry.text}</div>
            )}
          </li>
        ))}
      </ul>
      {viewer.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, maxHeight: 500, boxShadow: '0 0 16px #0ff2', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', justifyContent: 'center', margin: 'auto' }}>
            <button onClick={() => setViewer({ open: false, type: '', data: '', name: '' })} style={{ position: 'absolute', top: 10, right: 10, background: 'none', color: '#ffd9e3', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
            <span style={{ color: '#ffd9e3', fontWeight: 600, fontSize: '1.1em', marginBottom: 12 }}>{viewer.name}</span>
            {viewer.type.startsWith('image/') ? (
              <img src={viewer.data} alt={viewer.name} style={{ maxWidth: 450, maxHeight: 450, borderRadius: 8 }} />
            ) : viewer.type.startsWith('audio/') ? (
              <audio src={viewer.data} controls style={{ width: 400 }} />
            ) : viewer.type.startsWith('video/') ? (
              <video src={viewer.data} controls style={{ maxWidth: 450, maxHeight: 400, borderRadius: 8 }} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default Journal;
