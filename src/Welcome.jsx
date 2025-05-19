import { Rocket, MoonStar } from 'lucide-react';

function Welcome() {
  return (
    <div
      style={{
        textAlign: 'center',
        background: '#181818',
        borderRadius: 12,
        boxShadow: '0 0 8px #0ff2',
        padding: '1.5rem',
        color: '#eee',
        marginBottom: '1.5rem',
      }}
    >
      <h2 style={{ color: '#ffd9e3' }}>
        Welcome to Orbitly <Rocket size={20} />
      </h2>
      <p style={{ color: '#71f7ff' }}>Your cosmic planner for staying organized.</p>
    </div>
  );
}

export default Welcome;
