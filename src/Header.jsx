function Header() {
  return (
    <header style={{
      background: '#181818',
      padding: '1.5rem 2rem',
      borderRadius: '12px',
      marginBottom: '2rem',
      boxShadow: '0 0 8px #0ff2',
      textAlign: 'center',
    }}>
      <h1 style={{
        margin: 0,
        color: '#ffd9e3',
        fontSize: '2.1rem',
        letterSpacing: '0.03em',
        fontWeight: 700,
        textShadow: '0 2px 8px #0ff2',
      }}>Orbitly
      </h1>
    </header>
  );
}

export default Header;
