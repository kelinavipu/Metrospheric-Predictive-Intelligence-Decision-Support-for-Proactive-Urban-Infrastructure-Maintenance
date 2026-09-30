import React, { useState } from 'react';
import { useStore, store } from '../../store/useStore';
import { BrainCircuit, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';

export const PredictiveAnalytics: React.FC = () => {
  const timeHorizon = useStore(s => s.timeHorizon);
  const [backtestDate, setBacktestDate] = useState('2026-06-01');
  const [activeModel, setActiveModel] = useState<'champion' | 'challenger'>('champion');

  // Calibration curve points
  const calibrationPoints = [
    { p: 0.1, e: 0.09 },
    { p: 0.2, e: 0.21 },
    { p: 0.3, e: 0.28 },
    { p: 0.4, e: 0.42 },
    { p: 0.5, e: 0.51 },
    { p: 0.6, e: 0.59 },
    { p: 0.7, e: 0.72 },
    { p: 0.8, e: 0.79 },
    { p: 0.9, e: 0.91 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Model Horizon & Selection */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={18} style={{ color: 'var(--accent)' }} />
              Predictive Analytics & Model Validation
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Time-split validation (no future data leakage), Platt/isotonic probability calibration, and survival curves
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveModel('champion')}
              className={activeModel === 'champion' ? 'btn-matte' : 'btn-matte-secondary'}
              style={{ fontSize: '12px' }}
            >
              Champion: HistGBDT (v2.4)
            </button>
            <button
              onClick={() => setActiveModel('challenger')}
              className={activeModel === 'challenger' ? 'btn-matte' : 'btn-matte-secondary'}
              style={{ fontSize: '12px' }}
            >
              Challenger: XGB-Stack (v2.5)
            </button>
          </div>
        </div>
      </div>

      {/* Headline Performance Validation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>AUROC (90-DAY HORIZON)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {activeModel === 'champion' ? '0.842' : '0.856'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '4px' }}>Target &gt;= 0.800 (Pass)</div>
        </div>

        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SURVIVAL C-INDEX</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            0.738
          </div>
          <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '4px' }}>Target &gt;= 0.700 (Pass)</div>
        </div>

        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>BRIER SCORE (CALIBRATION)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            0.084
          </div>
          <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '4px' }}>Well-calibrated (&lt; 0.10)</div>
        </div>

        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PRECISION @ K (K=15 CREW)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            86.7%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '4px' }}>13 of top 15 confirmed</div>
        </div>
      </div>

      {/* Charts Grid: Calibration Diagram & Probability Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Reliability Diagram */}
        <div className="card-matte">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Probability Calibration Reliability Diagram</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Empirical observed failure frequency vs. predicted probability (Diagonal = perfect calibration)
          </p>

          <div style={{ height: '240px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', position: 'relative', padding: '20px' }}>
            <svg width="100%" height="100%" viewBox="0 0 300 200">
              {/* Perfect calibration diagonal */}
              <line x1="30" y1="170" x2="270" y2="30" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Axes */}
              <line x1="30" y1="170" x2="270" y2="170" stroke="var(--text-muted)" strokeWidth="1" />
              <line x1="30" y1="30" x2="30" y2="170" stroke="var(--text-muted)" strokeWidth="1" />
              {/* Points */}
              {calibrationPoints.map((pt, i) => {
                const x = 30 + pt.p * 240;
                const y = 170 - pt.e * 140;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="var(--accent)" />
                    {i > 0 && (
                      <line
                        x1={30 + calibrationPoints[i - 1].p * 240}
                        y1={170 - calibrationPoints[i - 1].e * 140}
                        x2={x}
                        y2={y}
                        stroke="var(--accent)"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
              <text x="140" y="195" fontSize="10" fill="var(--text-muted)" textAnchor="middle">Predicted Probability</text>
              <text x="15" y="100" fontSize="10" fill="var(--text-muted)" transform="rotate(-90 15 100)" textAnchor="middle">Empirical Frequency</text>
            </svg>
          </div>
        </div>

        {/* Lift & Gain Curve */}
        <div className="card-matte">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Cumulative Lift Curve</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Top deciles capture 3.8x baseline failure rate (Crew capacity optimization)
          </p>

          <div style={{ height: '240px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', position: 'relative', padding: '20px' }}>
            <svg width="100%" height="100%" viewBox="0 0 300 200">
              <line x1="30" y1="170" x2="270" y2="170" stroke="var(--text-muted)" strokeWidth="1" />
              <line x1="30" y1="30" x2="30" y2="170" stroke="var(--text-muted)" strokeWidth="1" />
              {/* Baseline 1.0 */}
              <line x1="30" y1="130" x2="270" y2="130" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="275" y="133" fontSize="9" fill="var(--text-muted)">1.0x</text>

              {/* Lift bars */}
              <rect x="50" y="50" width="28" height="120" fill="var(--accent)" />
              <text x="64" y="45" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">3.8x</text>

              <rect x="95" y="80" width="28" height="90" fill="var(--accent)" />
              <text x="109" y="75" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">2.6x</text>

              <rect x="140" y="110" width="28" height="60" fill="var(--accent)" />
              <text x="154" y="105" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">1.7x</text>

              <rect x="185" y="125" width="28" height="45" fill="var(--accent-hover)" />
              <text x="199" y="120" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">1.1x</text>

              <rect x="230" y="150" width="28" height="20" fill="var(--accent-hover)" />
              <text x="244" y="145" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">0.5x</text>

              <text x="150" y="195" fontSize="10" fill="var(--text-muted)" textAnchor="middle">Risk Decile (1 = Highest Risk)</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Historical Backtesting Slider */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Historical Backtest Simulation Slider</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Step backward in time: What would UrbanPulse have predicted on date X versus ground-truth subsequent failures?
            </p>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
            {backtestDate}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="12"
          defaultValue="6"
          onChange={e => {
            const m = parseInt(e.target.value);
            setBacktestDate(`2026-${m < 10 ? '0' + m : m}-01`);
          }}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          <span>2026-01-01</span>
          <span>2026-06-01 (Mid-Year)</span>
          <span>2026-12-01</span>
        </div>

        <div className="card-matte-inset" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PREDICTED HIGH-RISK</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>24 Assets</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTUALLY FAILED (90d)</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--risk-critical)' }}>21 Assets</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LEAD TIME DETECTED</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>42 Days Avg</div>
          </div>
        </div>
      </div>
    </div>
  );
};
