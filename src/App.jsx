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
  // Set 'reminders' as the default section
  const [openSection, setOpenSection] = useState('reminders'); // 'reminders' | 'schedule' | 'calendar' | 'voice' | 'journal' | null
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
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      // If not accepted, re-show banner after a short delay for retry
      if (outcome !== 'accepted') {
        setTimeout(() => setShowInstallBanner(true), 2000);
      }
    } else {
      // Fallback: try to open native install prompt if available
      if (window.matchMedia('(display-mode: browser)').matches && window.navigator.standalone !== true) {
        window.location.reload(); // reload to re-trigger beforeinstallprompt if possible
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

  // Render the current section as a page
  let sectionContent = null;
  if (openSection === 'schedule') {
    sectionContent = <>
      <button onClick={() => setOpenSection(null)} style={{ position: 'absolute', left: 16, top: 16, background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.2em', cursor: 'pointer' }} aria-label="Back">← Back</button>
      <Schedule onClose={() => setOpenSection(null)} />
    </>;
  } else if (openSection === 'calendar') {
    sectionContent = <>
      <button onClick={() => setOpenSection(null)} style={{ position: 'absolute', left: 16, top: 16, background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.2em', cursor: 'pointer' }} aria-label="Back">← Back</button>
      <Calendar />
    </>;
  } else if (openSection === 'voice') {
    sectionContent = <>
      <button onClick={() => setOpenSection(null)} style={{ position: 'absolute', left: 16, top: 16, background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.2em', cursor: 'pointer' }} aria-label="Back">← Back</button>
      <VoiceMemos />
    </>;
  } else if (openSection === 'journal') {
    sectionContent = <>
      <button onClick={() => setOpenSection(null)} style={{ position: 'absolute', left: 16, top: 16, background: 'none', border: 'none', color: '#ffd9e3', fontSize: '1.2em', cursor: 'pointer' }} aria-label="Back">← Back</button>
      <Journal />
    </>;
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
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
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
        {!openSection && (
          <>
            <div style={{textAlign: 'center'}}>
              <Header />
              <Welcome />
              <div style={{ margin: '2rem 0' }}>
                <Reminders />
              </div>
            </div>
          </>
        )}
        {openSection ? (
          <div style={{ flex: 1, position: 'relative' }}>
            {sectionContent}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <footer style={{
          width: '100%',
          background: '#181818',
          borderTop: '1px solid #222',
          borderRadius: '0 0 12px 12px',
          padding: '0.7rem 0.5rem 0.5rem 0.5rem',
          display: 'flex',
          justifyContent: 'space-around',
          gap: '0.5rem',
          position: 'sticky',
          bottom: 0,
          left: 0,
          zIndex: 10,
        }}>
          <button onClick={() => { triggerHaptic(); setOpenSection('schedule'); }} style={{ ...buttonStyle, background: openSection === 'schedule' ? '#222' : '#181818', color: openSection === 'schedule' ? '#71f7ff' : '#eee', flex: 1 }}>📅 Schedule</button>
          <button onClick={() => { triggerHaptic(); setOpenSection('calendar'); }} style={{ ...buttonStyle, background: openSection === 'calendar' ? '#222' : '#181818', color: openSection === 'calendar' ? '#71f7ff' : '#eee', flex: 1 }}>🗓️ Calendar</button>
          <button onClick={() => { triggerHaptic(); setOpenSection('voice'); }} style={{ ...buttonStyle, background: openSection === 'voice' ? '#222' : '#181818', color: openSection === 'voice' ? '#ffd9e3' : '#eee', flex: 1 }}>🎤 Voice</button>
          <button onClick={() => { triggerHaptic(); setOpenSection('journal'); }} style={{ ...buttonStyle, background: openSection === 'journal' ? '#222' : '#181818', color: openSection === 'journal' ? '#ffd9e3' : '#eee', flex: 1 }}>📓 Journal</button>
        </footer>
      </div>
    </div>
  );
}

export default App;
