// ============================================================
//  Agrovision v2 — Shared UI Components  (dark mode aware)
// ============================================================
import { useState, useContext, createContext } from 'react';

// ─── Theme Context ────────────────────────────────────────────────────────────
export const ThemeCtx = createContext({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const stored = () => {
    try { return localStorage.getItem('fiq-dark') === '1'; } catch { return false; }
  };
  const [dark, setDark] = useState(stored);
  const toggle = () => setDark(d => {
    const next = !d;
    try { localStorage.setItem('fiq-dark', next ? '1' : '0'); } catch {}
    return next;
  });
  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>;
}

// ─── Token helper — returns correct value for light/dark ─────────────────────
const T = (dark, light, d) => dark ? d : light;

// ─── Palette ─────────────────────────────────────────────────────────────────
export const palette = (dark) => ({
  green:       '#1D9E75',
  greenDark:   '#16795a',
  greenLight:  dark ? 'rgba(29,158,117,0.18)' : '#EAF3DE',
  greenText:   dark ? '#4dd9a8' : '#2d5a0e',
  amber:       '#BA7517',
  amberLight:  dark ? 'rgba(186,117,23,0.18)' : '#FAEEDA',
  amberText:   dark ? '#f5c06a' : '#7a3f00',
  red:         '#E24B4A',
  redLight:    dark ? 'rgba(226,75,74,0.18)' : '#FCEBEB',
  redText:     dark ? '#f87171' : '#A32D2D',
  blue:        '#3b82f6',
  blueLight:   dark ? 'rgba(59,130,246,0.18)' : '#E6F1FB',
  blueText:    dark ? '#93c5fd' : '#185FA5',
  bg:          dark ? '#0f1117' : '#f0efeb',
  surface:     dark ? '#1a1f2e' : '#ffffff',
  surfaceAlt:  dark ? '#222736' : '#f7f7f5',
  surfaceHover:dark ? '#2a3045' : '#f0faf6',
  border:      dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
  text:        dark ? '#e8e8e6' : '#1a1a18',
  muted:       dark ? 'rgba(255,255,255,0.45)' : '#6b6b67',
  inputBg:     dark ? '#141820' : '#fafaf8',
  inputBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
  shadow:      dark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
  modalShadow: dark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(0,0,0,0.22)',
});

// ─── Badge ────────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  Active:'green', Growing:'green', Good:'green', Normal:'green', OK:'green',
  Harvested:'blue', Income:'green', Expense:'red',
  Inactive:'amber', Monitoring:'amber', 'Service Due':'amber', High:'amber',
  Moderate:'amber', Paused:'amber', 'Low Water':'amber', Low:'amber', Warning:'amber',
  Alert:'red', 'Repair Needed':'red', Critical:'red', Overdue:'red',
};

export const Badge = ({ label }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  const colorKey = STATUS_COLOR[label] || 'blue';
  const map = {
    green: { bg: p.greenLight, color: p.greenText },
    amber: { bg: p.amberLight, color: p.amberText },
    red:   { bg: p.redLight,   color: p.redText   },
    blue:  { bg: p.blueLight,  color: p.blueText  },
  };
  const s = map[colorKey];
  return (
    <span style={{
      fontSize: 11, padding: '3px 9px', borderRadius: 20,
      background: s.bg, color: s.color, fontWeight: 700,
      display: 'inline-block', whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>{label}</span>
  );
};

// ─── MetricCard ───────────────────────────────────────────────────────────────
export const MetricCard = ({ label, value, sub, valueColor, icon }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{
      background: p.surface, borderRadius: 14, padding: '1.1rem 1.25rem',
      border: `1px solid ${p.border}`, boxShadow: p.shadow,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: p.muted, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{label}</div>
        {icon && <span style={{ fontSize: 18, opacity: 0.7 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: valueColor || p.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: p.muted }}>{sub}</div>}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{
      background: p.surface, border: `1px solid ${p.border}`,
      borderRadius: 14, padding: '1.25rem 1.5rem',
      marginBottom: '1rem', boxShadow: p.shadow, ...style,
    }}>{children}</div>
  );
};

// ─── CardHeader ───────────────────────────────────────────────────────────────
export const CardHeader = ({ title, right }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: p.text }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  );
};

// ─── Table ────────────────────────────────────────────────────────────────────
export const Table = ({ headers, rows, emptyMsg = 'No records found' }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${p.border}` }}>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 400 }}>
        <thead>
          <tr style={{ background: p.surfaceAlt }}>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left', color: p.muted, fontWeight: 700,
                padding: '9px 14px', borderBottom: `1px solid ${p.border}`,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={headers.length} style={{ padding: '28px 14px', textAlign: 'center', color: p.muted, fontSize: 13 }}>{emptyMsg}</td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? p.surface : p.surfaceAlt, transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = p.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? p.surface : p.surfaceAlt}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '10px 14px',
                    borderBottom: i < rows.length - 1 ? `1px solid ${p.border}` : 'none',
                    verticalAlign: 'middle', fontSize: 13, color: p.text,
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── AlertItem ────────────────────────────────────────────────────────────────
export const AlertItem = ({ type, icon, title, desc, time, onResolve }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  const styles = {
    red:   { background: p.redLight,   borderLeft: `4px solid ${p.red}`   },
    amber: { background: p.amberLight, borderLeft: `4px solid ${p.amber}` },
    green: { background: p.greenLight, borderLeft: `4px solid ${p.green}` },
  };
  const s = styles[type] || styles.amber;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', borderRadius: 10, marginBottom: 8, ...s }}>
      <span style={{ fontSize: 17, paddingTop: 1 }}>{icon || (type === 'red' ? '🔴' : type === 'green' ? '✅' : '🟡')}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: p.text, marginBottom: 2 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: p.muted, lineHeight: 1.5 }}>{desc}</div>}
        {time && <div style={{ fontSize: 11, color: p.muted, marginTop: 4 }}>{time}</div>}
      </div>
      {onResolve && (
        <button onClick={onResolve} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none',
          background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
          cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', color: p.text,
        }}>Resolve ✓</button>
      )}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, width = 480 }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: p.surface, borderRadius: 16, padding: '1.75rem 2rem',
        width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: p.modalShadow, border: `1px solid ${p.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: p.text }}>{title}</span>
          <button onClick={onClose} style={{
            background: p.surfaceAlt, border: 'none', width: 30, height: 30,
            borderRadius: '50%', cursor: 'pointer', fontSize: 14, color: p.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── ModalFooter ─────────────────────────────────────────────────────────────
export const ModalFooter = ({ onCancel, onSave, saveLabel = 'Save', loading }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${p.border}` }}>
      <button onClick={onCancel} style={{
        padding: '9px 20px', borderRadius: 9, fontSize: 13, cursor: 'pointer',
        border: `1px solid ${p.border}`, background: p.surfaceAlt,
        fontWeight: 600, color: p.muted,
      }}>Cancel</button>
      <button onClick={onSave} disabled={loading} style={{
        padding: '9px 22px', borderRadius: 9,
        background: loading ? '#a8d5c4' : 'linear-gradient(135deg,#1D9E75,#16795a)',
        color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 2px 8px rgba(29,158,117,0.35)',
      }}>{loading ? 'Saving…' : saveLabel}</button>
    </div>
  );
};

// ─── Form helpers ─────────────────────────────────────────────────────────────
export const Field = ({ label, children }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ fontSize: 12, color: p.muted, marginBottom: 5, display: 'block', fontWeight: 600, letterSpacing: '0.02em' }}>{label}</label>
      {children}
    </div>
  );
};

export const Input = ({ value, onChange, placeholder, type = 'text', min, required }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  const st = {
    width: '100%', padding: '9px 12px', borderRadius: 9,
    border: `1.5px solid ${p.inputBorder}`, background: p.inputBg,
    color: p.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s',
  };
  return (
    <input style={st} type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} required={required}
      onFocus={e => e.target.style.borderColor = '#1D9E75'}
      onBlur={e => e.target.style.borderColor = p.inputBorder}
    />
  );
};

export const Select = ({ value, onChange, options }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  const st = {
    width: '100%', padding: '9px 12px', borderRadius: 9,
    border: `1.5px solid ${p.inputBorder}`, background: p.inputBg,
    color: p.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', cursor: 'pointer',
  };
  return (
    <select style={st} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
};

export const FormGrid = ({ children, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 1rem' }}>{children}</div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
export const Toast = ({ message, type = 'success' }) =>
  message ? (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      background: type === 'error' ? '#E24B4A' : '#1D9E75',
      color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 13,
      zIndex: 400, fontWeight: 600, boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      maxWidth: 340, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{type === 'error' ? '⚠️' : '✅'}</span> {message}
    </div>
  ) : null;

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  return [toast, show];
}

// ─── ReminderBadge ────────────────────────────────────────────────────────────
export const ReminderBadge = ({ count }) =>
  count > 0 ? (
    <span style={{
      background: '#E24B4A', color: '#fff', fontSize: 10, fontWeight: 800,
      padding: '2px 6px', borderRadius: 10, marginLeft: 6,
      boxShadow: '0 1px 4px rgba(226,75,74,0.4)',
    }}>{count}</span>
  ) : null;

// ─── DarkToggle ───────────────────────────────────────────────────────────────
export const DarkToggle = () => {
  const { dark, toggle } = useTheme();
  const p = palette(dark);
  return (
    <button onClick={toggle} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{
      background: p.surfaceAlt, border: `1px solid ${p.border}`,
      borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 600, color: p.muted,
      transition: 'all .2s',
    }}>
      <span style={{ fontSize: 15 }}>{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export const Sidebar = ({ navItems, activeNav, onNav, onLogout, subtitle }) => {
  const { dark } = useTheme();
  const sidebarBg   = dark ? '#0d1117' : '#1a1f2e';
  const borderColor = 'rgba(255,255,255,0.08)';
  return (
    <div style={{ width: 230, minWidth: 230, background: sidebarBg, display: 'flex', flexDirection: 'column', boxShadow: '2px 0 12px rgba(0,0,0,0.2)' }}>
      {/* Logo */}
      <div style={{ padding: '1.4rem 1.4rem 1rem', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#1D9E75,#16795a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 8px rgba(29,158,117,0.4)',
          }}>🌾</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>FarmIQ</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
        {navItems.map(item => {
          const active = activeNav === item.id;
          return (
            <div key={item.id} onClick={() => onNav(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2,
              background: active ? 'rgba(29,158,117,0.2)' : 'transparent',
              color: active ? '#4dd9a8' : 'rgba(255,255,255,0.55)',
              fontWeight: active ? 700 : 400, fontSize: 13, transition: 'all .15s',
              borderLeft: active ? '3px solid #1D9E75' : '3px solid transparent',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <ReminderBadge count={item.badge} />}
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: '1rem 1.4rem', borderTop: `1px solid ${borderColor}` }}>
        <div onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: '6px 0', transition: 'color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <span>⬅</span> Logout
        </div>
      </div>
    </div>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────
export const Topbar = ({ title, userName, initials, isAdmin, right }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{
      background: p.surface, borderBottom: `1px solid ${p.border}`,
      padding: '0 1.75rem', height: 58,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
      boxShadow: dark ? '0 1px 6px rgba(0,0,0,0.3)' : '0 1px 6px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: p.text }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {right}
        <DarkToggle />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: isAdmin ? 'linear-gradient(135deg,#1D9E75,#16795a)' : 'linear-gradient(135deg,#185FA5,#0d3d6e)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: p.text, lineHeight: 1.2 }}>{userName}</div>
            <div style={{ fontSize: 10, color: p.muted }}>{isAdmin ? 'Administrator' : 'Farmer'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Btn ─────────────────────────────────────────────────────────────────────
export const Btn = ({ onClick, children, variant = 'default', small, disabled }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  const base = {
    borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1, fontFamily: 'inherit', transition: 'all .15s',
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: small ? '5px 11px' : '8px 16px',
    fontSize: small ? 12 : 13, border: 'none',
  };
  const variants = {
    default: { background: p.surfaceAlt, color: p.text, border: `1px solid ${p.border}` },
    primary: { background: 'linear-gradient(135deg,#1D9E75,#16795a)', color: '#fff', boxShadow: '0 2px 6px rgba(29,158,117,0.3)' },
    danger:  { background: p.redLight,   color: p.redText,   border: `1px solid rgba(226,75,74,0.25)` },
    warning: { background: p.amberLight, color: p.amberText, border: `1px solid rgba(186,117,23,0.25)` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>
  );
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => {
  const { dark } = useTheme();
  const p = palette(dark);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: p.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: p.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
};
