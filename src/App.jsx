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
  // Set null as the default section so Welcome/Reminders show immediately
  const [openSection, setOpenSection] = useState(null); // null = show Welcome/Reminders

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
    sectionContent = (
      <div style={{ position: 'relative' }}>
        <Schedule />
        <button
          onClick={() => setOpenSection(null)}
          style={{ position: 'absolute', right: 16, top: 16, background: '#222', color: '#eee', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontWeight: 600, cursor: 'pointer', fontSize: '1.1em', zIndex: 10 }}
          aria-label="Close schedule"
        >
          ✕
        </button>
      </div>
    );
  } else if (openSection === 'calendar') {
    sectionContent = (
      <div style={{ position: 'relative' }}>
        <Calendar />
        <button
          onClick={() => setOpenSection(null)}
          style={{ position: 'absolute', right: 16, top: 16, background: '#222', color: '#eee', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontWeight: 600, cursor: 'pointer', fontSize: '1.1em', zIndex: 10 }}
          aria-label="Close calendar"
        >
          ✕
        </button>
      </div>
    );
  } else if (openSection === 'voice') {
    sectionContent = (
      <div style={{ position: 'relative' }}>
        <VoiceMemos />
        <button
          onClick={() => setOpenSection(null)}
          style={{ position: 'absolute', right: 16, top: 16, background: '#222', color: '#eee', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontWeight: 600, cursor: 'pointer', fontSize: '1.1em', zIndex: 10 }}
          aria-label="Close voice memos"
        >
          ✕
        </button>
      
      </div>
    );
  } else if (openSection === 'journal') {
    sectionContent = (
      <div style={{ position: 'relative' }}>
        <Journal />
        <button
          onClick={() => setOpenSection(null)}
          style={{ position: 'absolute', right: 16, top: 16, background: '#222', color: '#eee', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontWeight: 600, cursor: 'pointer', fontSize: '1.1em', zIndex: 10 }}
          aria-label="Close journal"
        >
          ✕
        </button>
      </div>
    );
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
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '100vw',
          background: 'rgba(24,24,24,0.82)', // translucent dark background
          borderTop: '1px solid #222',
          borderRadius: '0 0 12px 12px',
          padding: '0.7rem 0.5rem 0.5rem 0.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          minHeight: 60,
          boxSizing: 'border-box',
          pointerEvents: 'auto',
          backdropFilter: 'blur(8px)', // subtle blur for glass effect
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: 450,
            justifyContent: 'space-evenly', // evenly space all section buttons
            alignItems: 'center',
            gap: 0,
          }}>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('schedule'); }}>Schedule</button>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('calendar'); }}>Calendar</button>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('voice'); }}>Voice</button>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('journal'); }}>Journal</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
