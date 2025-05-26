import { useState, useEffect } from 'react';
import Reminders from './Reminders';
import Header from './Header';
import Welcome from './Welcome';
import Schedule from './Schedule';
import Calendar from './Calendar';
import VoiceMemos from './VoiceMemos';
import Journal from './Journal';
import './App.css';

function App() {
  const [openSection, setOpenSection] = useState(null); // 'schedule' | 'calendar' | 'voice' | 'journal' | null
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
    }
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  };

  // Helper to trigger haptic feedback
  function triggerHaptic() {
    if (navigator.vibrate) {
      navigator.vibrate([30]); // short pulse
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#181818',
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        padding: '1.5rem',
        backgroundColor: '#111',
        borderRadius: '12px',
        boxShadow: '0 0 15px rgba(0, 255, 149, 0.06)',
        color: '#eee',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: 'relative',
      }}>
        {showInstallBanner && (
          <div style={{
            background: '#181818',
            border: '1px solid #333',
            borderRadius: 10,
            color: '#71f7ff',
            padding: '1em',
            marginBottom: 16,
            textAlign: 'center',
            boxShadow: '0 0 8px #0ff2',
            zIndex: 1000,
          }}>
            <strong>Install Orbitly for a native app experience!</strong><br />
            <button onClick={handleInstallClick} style={{
              marginTop: 10,
              background: '#71f7ff',
              color: '#181818',
              border: 'none',
              borderRadius: 8,
              padding: '0.5em 1.2em',
              fontWeight: 600,
              fontSize: '1em',
              cursor: 'pointer',
              boxShadow: '0 0 4px #0ff2',
            }}>Install</button>
            <button onClick={() => setShowInstallBanner(false)} style={{
              marginLeft: 10,
              background: 'none',
              color: '#ffd9e3',
              border: '1px solid #333',
              borderRadius: 8,
              padding: '0.5em 1.2em',
              fontWeight: 600,
              fontSize: '1em',
              cursor: 'pointer',
            }}>Dismiss</button>
          </div>
        )}
        <div style={{textAlign: 'center'}}>
          <Header />
          <Welcome />
        </div>
        <Reminders />
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1.5rem 0' }}>
          <button onClick={() => { triggerHaptic(); setOpenSection(openSection === 'schedule' ? null : 'schedule'); }} style={{ ...buttonStyle, background: openSection === 'schedule' ? '#222' : '#181818', color: openSection === 'schedule' ? '#71f7ff' : '#eee' }}>
            {openSection === 'schedule' ? 'Hide Schedules' : 'Show Schedules'}
          </button>
          <button onClick={() => { triggerHaptic(); setOpenSection(openSection === 'calendar' ? null : 'calendar'); }} style={{ ...buttonStyle, background: openSection === 'calendar' ? '#222' : '#181818', color: openSection === 'calendar' ? '#71f7ff' : '#eee' }}>
            {openSection === 'calendar' ? 'Hide Calendar' : 'Show Calendar'}
          </button>
          <button onClick={() => { triggerHaptic(); setOpenSection(openSection === 'voice' ? null : 'voice'); }} style={{ ...buttonStyle, background: openSection === 'voice' ? '#222' : '#181818', color: openSection === 'voice' ? '#ffd9e3' : '#eee' }}>
            {openSection === 'voice' ? 'Close Voice Memos' : '🎤 Voice Memos'}
          </button>
          <button onClick={() => { triggerHaptic(); setOpenSection(openSection === 'journal' ? null : 'journal'); }} style={{ ...buttonStyle, background: openSection === 'journal' ? '#222' : '#181818', color: openSection === 'journal' ? '#ffd9e3' : '#eee' }}>
            {openSection === 'journal' ? 'Close Journal' : '📓 Journal'}
          </button>
        </div>
        {openSection === 'schedule' && (
          <div style={{ marginTop: '1rem' }}>
            <Schedule onClose={() => setOpenSection(null)} />
          </div>
        )}
        {openSection === 'calendar' && (
          <div style={{ marginTop: '1rem' }}>
            <Calendar />
          </div>
        )}
        {openSection === 'voice' && (
          <div style={{ marginTop: '1rem' }}>
            <VoiceMemos />
          </div>
        )}
        {openSection === 'journal' && (
          <div style={{ marginTop: '1rem' }}>
            <Journal />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
