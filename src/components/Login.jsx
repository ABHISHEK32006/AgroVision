// ============================================================
//  Agrovision v2 — Login Page (dark mode aware)
// ============================================================
import { useState } from 'react';

import { useTheme, palette, DarkToggle } from './Shared';

export default function Login({ onLogin }) {
  const { dark } = useTheme();
  const p = palette(dark);
  const [view,     setView]     = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin() {
  if (!username.trim() || !password) {
    setError('Please enter username and password');
    return;
  }

  setLoading(true);
  setError('');

  setTimeout(() => {
    if (username === 'admin' && password === 'admin123') {
      onLogin({
        username: 'admin',
        role: 'admin'
      });
    } else {
      setError('Use admin / admin123');
    }
    setLoading(false);
  }, 500);
}

  const bg = dark
    ? 'linear-gradient(135deg,#0d1117 0%,#0f1a14 50%,#111318 100%)'
    : 'linear-gradient(135deg,#e8f5e9 0%,#f1f8e9 50%,#eeede9 100%)';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, padding: '1.5rem',
      fontFamily: "'Segoe UI', system-ui, sans-serif", transition: 'background .2s',
    }}>
      {/* Dark toggle — top right */}
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <DarkToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1D9E75,#16795a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, margin: '0 auto 1rem', boxShadow: '0 4px 16px rgba(29,158,117,0.4)',
          }}>🌾</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: p.text, letterSpacing: '-0.5px' }}>Agrovision</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: p.muted }}>Smart Farming Database Management System</p>
        </div>

        {view === 'login' ? (
          <LoginCard
            p={p} dark={dark}
            username={username} setUsername={setUsername}
            password={password} setPassword={setPassword}
            showPass={showPass} setShowPass={setShowPass}
            loading={loading} error={error} setError={setError}
            onLogin={handleLogin}
            onForgot={() => { setView('forgot'); setError(''); }}
          />
        ) : (
          <ForgotPassword p={p} dark={dark} onBack={() => { setView('login'); setError(''); }} />
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: p.muted, marginTop: '1.25rem' }}>
          © {new Date().getFullYear()} FarmIQ · All rights reserved
        </p>
      </div>
    </div>
  );
}

function LoginCard({ p, dark, username, setUsername, password, setPassword, showPass, setShowPass, loading, error, setError, onLogin, onForgot }) {
  const cardBg = dark ? '#1a1f2e' : '#fff';
  const border = dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)';
  const shadow = dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.10)';
  const hintBg = dark ? '#141820' : '#f7f7f5';

  return (
    <div style={{ background: cardBg, borderRadius: 18, padding: '2rem', boxShadow: shadow, border }}>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: 18, fontWeight: 700, color: p.text }}>Sign in to your account</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={lbl(p)}>Username</label>
        <div style={{ position: 'relative' }}>
          <span style={ico}>👤</span>
          <input style={inp(p, dark)} value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            placeholder="Enter your username" autoFocus
            onKeyDown={e => e.key === 'Enter' && onLogin()}
            onFocus={e => e.target.style.borderColor = '#1D9E75'}
            onBlur={e => e.target.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'} />
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={lbl(p)}>Password</label>
        <div style={{ position: 'relative' }}>
          <span style={ico}>🔒</span>
          <input style={inp(p, dark)} type={showPass ? 'text' : 'password'} value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password"
            onKeyDown={e => e.key === 'Enter' && onLogin()}
            onFocus={e => e.target.style.borderColor = '#1D9E75'}
            onBlur={e => e.target.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'} />
          <span onClick={() => setShowPass(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 16, userSelect: 'none' }}>
            {showPass ? '🙈' : '👁️'}
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
        <span onClick={onForgot} style={{ fontSize: 12, color: '#1D9E75', cursor: 'pointer', fontWeight: 600 }}>
          Forgot password?
        </span>
      </div>

      {error && (
        <div style={{
          background: dark ? 'rgba(226,75,74,0.15)' : '#FCEBEB',
          border: '1px solid rgba(226,75,74,0.3)', borderRadius: 8,
          padding: '9px 12px', fontSize: 12.5, color: dark ? '#f87171' : '#A32D2D',
          marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6,
        }}>⚠️ {error}</div>
      )}

      <button onClick={onLogin} disabled={loading} style={{
        width: '100%', padding: '12px', borderRadius: 10,
        background: loading ? '#a8d5c4' : 'linear-gradient(135deg,#1D9E75,#16795a)',
        color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 3px 12px rgba(29,158,117,0.4)',
      }}>
        {loading ? '⏳ Signing in…' : 'Sign In →'}
      </button>

      <div style={{
        marginTop: '1.25rem', fontSize: 11.5, color: p.muted,
        background: hintBg, borderRadius: 8, padding: '9px 12px', lineHeight: 1.7, textAlign: 'center',
      }}>
        Admin default — <strong style={{ color: p.text }}>admin</strong> / <strong style={{ color: p.text }}>admin123</strong><br />
        Farmers use credentials set by the Admin
      </div>
    </div>
  );
}

function ForgotPassword({ p, dark, onBack }) {
  const [step,    setStep]    = useState(1);
  const [uname,   setUname]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const cardBg = dark ? '#1a1f2e' : '#fff';
  const border = dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)';
  const shadow = dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.10)';

  async function handleSubmit() {
    if (!uname.trim()) { setError('Please enter your username'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);
    setStep(2);
  }

  return (
    <div style={{ background: cardBg, borderRadius: 18, padding: '2rem', boxShadow: shadow, border }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 13, color: p.muted, cursor: 'pointer', marginBottom: '1rem', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back to login
      </button>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: 18, fontWeight: 700, color: p.text }}>Forgot Password</h2>

      {step === 1 ? (
        <>
          <p style={{ fontSize: 13, color: p.muted, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Enter your username and we'll show you how to reset your password.
          </p>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={lbl(p)}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={ico}>👤</span>
              <input style={inp(p, dark)} value={uname}
                onChange={e => { setUname(e.target.value); setError(''); }}
                placeholder="Enter your username" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                onFocus={e => e.target.style.borderColor = '#1D9E75'}
                onBlur={e => e.target.style.borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'} />
            </div>
          </div>
          {error && <div style={{ color: dark ? '#f87171' : '#A32D2D', fontSize: 12.5, marginBottom: '1rem' }}>⚠️ {error}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: loading ? '#a8d5c4' : 'linear-gradient(135deg,#1D9E75,#16795a)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '⏳ Checking…' : 'Continue →'}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔑</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: p.text, marginBottom: '0.75rem' }}>Contact Your Admin</div>
          <p style={{ fontSize: 13, color: p.muted, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Password resets are managed by the system administrator.<br />
            Contact your admin with username <strong style={{ color: p.text }}>"{uname}"</strong>.
          </p>
          <div style={{
            background: dark ? 'rgba(29,158,117,0.15)' : '#EAF3DE',
            borderRadius: 10, padding: '12px 16px', fontSize: 12.5,
            color: dark ? '#4dd9a8' : '#3B6D11', lineHeight: 1.7, marginBottom: '1.5rem',
          }}>
            📞 Admin can reset passwords from <strong>Farmer Management</strong> in the Admin Portal.
          </div>
          <button onClick={onBack} style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: 'linear-gradient(135deg,#1D9E75,#16795a)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>Back to Login</button>
        </div>
      )}
    </div>
  );
}

const lbl = (p) => ({ display: 'block', fontSize: 12.5, fontWeight: 600, color: p.muted, marginBottom: 6 });
const ico = { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' };
const inp = (p, dark) => ({
  width: '100%', padding: '10px 38px 10px 34px', borderRadius: 9,
  border: `1.5px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}`,
  background: dark ? '#141820' : '#fafafa',
  color: p.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .15s',
});
