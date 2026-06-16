import { useState } from 'react';
import { ThemeProvider, useTheme, palette } from './components/Shared';
import Login        from './components/Login';
import AdminPortal from './components/AdminPortal';
import FarmerPortal from './components/FarmerPortal';

function AppInner() {
  const [user, setUser] = useState(null);
  const { dark } = useTheme();
  const p = palette(dark);

  return (
    <div style={{ minHeight: '100vh', background: p.bg, color: p.text, fontFamily: "'Segoe UI', system-ui, sans-serif", transition: 'background .2s, color .2s' }}>
      {!user               && <Login onLogin={setUser} />}
      {user?.role==='admin' && <AdminPortal  user={user} onLogout={() => setUser(null)} />}
      {user?.role==='farmer'&& <FarmerPortal user={user} onLogout={() => setUser(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
