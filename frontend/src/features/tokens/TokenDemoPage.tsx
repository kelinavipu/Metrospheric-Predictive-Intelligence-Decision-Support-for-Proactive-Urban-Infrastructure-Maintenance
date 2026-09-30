import React from 'react';
import { useStore, store } from '../../store/useStore';

interface Swatch {
  name: string;
  variable: string;
  hexLight: string;
  hexDark: string;
  use: string;
}

const PALETTES: Swatch[] = [
  { name: 'Background', variable: '--bg', hexLight: '#ECE8E1', hexDark: '#23262A', use: 'Main app background canvas (warm putty / slate)' },
  { name: 'Surface', variable: '--surface', hexLight: '#F4F1EB', hexDark: '#2C3035', use: 'Cards, panels, modal dialogs' },
  { name: 'Surface Inset', variable: '--surface-2', hexLight: '#E3DED5', hexDark: '#34393F', use: 'Table stripes, input backgrounds, active rails' },
  { name: 'Border', variable: '--border', hexLight: '#CFC8BC', hexDark: '#444A51', use: '1px hairline dividers and subtle card borders' },
  { name: 'Primary Text', variable: '--text', hexLight: '#2E3033', hexDark: '#E4E0D8', use: 'Charcoal ink body text and headlines' },
  { name: 'Secondary Text', variable: '--text-muted', hexLight: '#6B6B66', hexDark: '#A29E96', use: 'Metadata, labels, table subtitles' },
  { name: 'Accent', variable: '--accent', hexLight: '#5F7A6F', hexDark: '#86A596', use: 'Primary actions, active pins, badges' },
  { name: 'Accent Hover', variable: '--accent-hover', hexLight: '#516B60', hexDark: '#98B5A6', use: 'Interactive button hover state' },
  { name: 'Accent Soft', variable: '--accent-soft', hexLight: '#D5DED6', hexDark: '#38423E', use: 'Row selection tint, focus highlights' },
  { name: 'Info / Water', variable: '--info', hexLight: '#66808F', hexDark: '#8FA9B8', use: 'Hydraulic mains, informational cues' },
];

const RISK_BANDS = [
  { band: 'Low Risk', hex: '#8FA38A', desc: 'Nominal condition (AHI 80-100, p_fail < 0.10)' },
  { band: 'Moderate Risk', hex: '#C9A45C', desc: 'Fair condition (AHI 60-79, p_fail 0.10-0.30)' },
  { band: 'High Risk', hex: '#C27B54', desc: 'Pre-failure degradation (AHI 40-59, p_fail 0.30-0.60)' },
  { band: 'Critical Risk', hex: '#A0484A', desc: 'Immediate intervention (AHI < 40, p_fail > 0.60)' },
  { band: 'Unknown / Sensor Offline', hex: '#A8A399', desc: 'Insufficient data / stale telemetry' },
];

const ASSET_TYPE_COLORS = [
  { type: 'Road Segment', hex: '#6C8A7B' },
  { type: 'Water Main', hex: '#6E8497' },
  { type: 'Sewer Line', hex: '#8C7A6B' },
  { type: 'Storm Drain', hex: '#A0805A' },
  { type: 'Streetlight', hex: '#7C6F8A' },
  { type: 'Traffic Signal', hex: '#8A9A6A' },
  { type: 'Bridge', hex: '#9A6F6F' },
  { type: 'Footpath', hex: '#7A8A8F' },
];

export const TokenDemoPage: React.FC = () => {
  const theme = useStore(s => s.theme);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              Matte Clay Design Tokens
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Architectural printed-cartography aesthetic adhering to Section 12: flat fills, hairline borders, zero blur shadows, zero gradients.
            </p>
          </div>
          <button
            onClick={() => store.toggleTheme()}
            className="btn-matte-secondary"
          >
            Switch to {theme === 'light' ? 'Slate Matte (Dark)' : 'Sandstone (Light)'}
          </button>
        </div>
      </div>

      {/* Surface Tokens */}
      <div className="card-matte">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Core UI Palette ({theme.toUpperCase()})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {PALETTES.map(p => {
            const currentHex = theme === 'light' ? p.hexLight : p.hexDark;
            return (
              <div key={p.variable} className="card-matte-inset">
                <div
                  style={{
                    height: '48px',
                    backgroundColor: `var(${p.variable})`,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ fontWeight: 600, fontSize: '12px' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {p.variable} ({currentHex})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.use}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk / Status Palette */}
      <div className="card-matte">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Risk & Consequence Bands (Flat, Colorblind-Safe)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {RISK_BANDS.map(r => (
            <div key={r.band} className="card-matte-inset">
              <div
                style={{
                  height: '36px',
                  backgroundColor: r.hex,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  marginBottom: '8px'
                }}
              />
              <div style={{ fontWeight: 600, fontSize: '12px' }}>{r.band}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{r.hex}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Categorical Palette */}
      <div className="card-matte">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Asset Type Categorical Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {ASSET_TYPE_COLORS.map(a => (
            <div key={a.type} className="card-matte-inset" style={{ textAlign: 'center', padding: '10px 6px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: a.hex,
                  borderRadius: '50%',
                  margin: '0 auto 8px',
                  border: '1px solid var(--border)'
                }}
              />
              <div style={{ fontWeight: 500, fontSize: '11px' }}>{a.type}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{a.hex}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography & Controls */}
      <div className="card-matte">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Typography & Hairline Controls</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Typography Specimens:</div>
            <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: '4px' }}>
              IBM Plex Sans Headline (20px / 700)
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
              Body text formatted for municipal asset registries, engineering work orders, and complaint narratives.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', backgroundColor: 'var(--surface-2)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
              ASSET-WM-0042 | LAT: 12.9716 LON: 77.5946 | AHI: 43.2 | P_FAIL_90D: 0.684
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Button & Badge Specimens:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button className="btn-matte">Primary Action</button>
              <button className="btn-matte-secondary">Secondary Action</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge-risk badge-risk-critical">Critical Risk</span>
              <span className="badge-risk badge-risk-high">High Risk</span>
              <span className="badge-risk badge-risk-moderate">Moderate</span>
              <span className="badge-risk badge-risk-low">Low Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
