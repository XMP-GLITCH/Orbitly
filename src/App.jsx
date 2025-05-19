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

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  };

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
        <div style={{textAlign: 'center'}}>
          <Header />
          <Welcome />
        </div>
        <Reminders />
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1.5rem 0' }}>
          <button onClick={() => setOpenSection(openSection === 'schedule' ? null : 'schedule')} style={{ ...buttonStyle, background: openSection === 'schedule' ? '#222' : '#181818', color: openSection === 'schedule' ? '#71f7ff' : '#eee' }}>
            {openSection === 'schedule' ? 'Hide Schedules' : 'Show Schedules'}
          </button>
          <button onClick={() => setOpenSection(openSection === 'calendar' ? null : 'calendar')} style={{ ...buttonStyle, background: openSection === 'calendar' ? '#222' : '#181818', color: openSection === 'calendar' ? '#71f7ff' : '#eee' }}>
            {openSection === 'calendar' ? 'Hide Calendar' : 'Show Calendar'}
          </button>
          <button onClick={() => setOpenSection(openSection === 'voice' ? null : 'voice')} style={{ ...buttonStyle, background: openSection === 'voice' ? '#222' : '#181818', color: openSection === 'voice' ? '#ffd9e3' : '#eee' }}>
            {openSection === 'voice' ? 'Close Voice Memos' : '🎤 Voice Memos'}
          </button>
          <button onClick={() => setOpenSection(openSection === 'journal' ? null : 'journal')} style={{ ...buttonStyle, background: openSection === 'journal' ? '#222' : '#181818', color: openSection === 'journal' ? '#ffd9e3' : '#eee' }}>
            {openSection === 'journal' ? 'Close Journal' : '🪐 Journal'}
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
