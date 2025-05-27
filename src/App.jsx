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

  // Push Notification Logic
  useEffect(() => {
    // Only run in browser
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let swReg = null;
    let vapidKey = null;

    // Get VAPID public key from backend
    fetch('http://localhost:4000/vapidPublicKey')
      .then(res => res.json())
      .then(data => {
        vapidKey = data.key;
        return navigator.serviceWorker.register('/service-worker.js');
      })
      .then(reg => {
        swReg = reg;
        return swReg.pushManager.getSubscription();
      })
      .then(async (sub) => {
        if (!sub && vapidKey) {
          // Subscribe user
          const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
          const newSub = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
          // Send subscription to backend
          await fetch('http://localhost:4000/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSub)
          });
        } else if (sub) {
          // Already subscribed, ensure backend knows
          await fetch('http://localhost:4000/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
          });
        }
      })
      .catch(err => {
        // Ignore if user blocks or unsupported
        // Optionally show a warning in UI
        // console.error('Push setup error', err);
      });

    // Helper to convert VAPID key
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  }, []);

  // Always prompt for install if not installed
  useEffect(() => {
    let intervalId;
    if (!window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone) {
      intervalId = setInterval(() => {
        if (!showInstallBanner && !window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone) {
          setShowInstallBanner(true);
        }
      }, 15000); // re-prompt every 15 seconds if dismissed
    }
    return () => intervalId && clearInterval(intervalId);
  }, [showInstallBanner]);

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
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 0,
          }}>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('schedule'); }}>📅 Schedule</button>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('calendar'); }}>🗓️ Calendar</button>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('voice'); }}>🎤 Voice</button>
            <button style={{ ...buttonStyle, flex: 1, minWidth: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', padding: '0.5em 0.2em' }} onClick={() => { triggerHaptic(); setOpenSection('journal'); }}>📓 Journal</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
