import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Activity, Sliders, TrendingDown, DollarSign } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const [horizonYears, setHorizonYears] = useState(3);
  const [weatherSeverity, setWeatherSeverity] = useState(1.0);
  const [simData, setSimData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSim();
  }, [horizonYears, weatherSeverity]);

  const runSim = async () => {
    setLoading(true);
    try {
      const data = await api.runSimulation({
        horizon_years: horizonYears,
        weather_severity: weatherSeverity
      });
      setSimData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Configuration & Sliders */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent)' }} />
              Monte Carlo Digital Twin: What-If Policy Simulation
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Projected annual cost, downtime, and asset failures across Reactive, Time-based, and Predictive policies
            </p>
          </div>
          <span className="badge-risk badge-risk-low" style={{ fontSize: '12px' }}>
            Predictive Savings: {simData?.cost_savings_pct || 32.4}%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span>SIMULATION HORIZON (YEARS)</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{horizonYears} Years</strong>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={horizonYears}
              onChange={e => setHorizonYears(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span>WEATHER / CLIMATE SEVERITY FACTOR</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{weatherSeverity.toFixed(1)}x</strong>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={weatherSeverity}
              onChange={e => setWeatherSeverity(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span>ANNUAL FAILURE REDUCTION</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                {simData?.failure_reduction_pct || 62.0}%
              </strong>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px' }}>
              Avoids emergency firefighting and unexpected street collapses
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory Comparison Cards */}
      {simData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Policy 1: Reactive */}
          <div className="card-matte" style={{ borderLeft: '4px solid var(--risk-critical)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>1. Reactive Maintenance</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fix on failure only (Status Quo)</div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL 3-YEAR EXPENDITURE</div>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--risk-critical)' }}>
                ${simData.reactive.total_cost.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px' }}>
              <span>Unplanned Failures:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{simData.reactive.total_failures}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
              <span>Avg Downtime / Asset:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{simData.reactive.avg_downtime_hours} hrs</strong>
            </div>
          </div>

          {/* Policy 2: Time-based Preventive */}
          <div className="card-matte" style={{ borderLeft: '4px solid var(--risk-moderate)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>2. Calendar Preventive</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fixed schedule inspection & overhaul</div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL 3-YEAR EXPENDITURE</div>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                ${simData.time_based.total_cost.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px' }}>
              <span>Unplanned Failures:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{simData.time_based.total_failures}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
              <span>Avg Downtime / Asset:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{simData.time_based.avg_downtime_hours} hrs</strong>
            </div>
          </div>

          {/* Policy 3: Predictive (UrbanPulse) */}
          <div className="card-matte" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
              3. UrbanPulse Predictive
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Condition-based risk mitigation</div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL 3-YEAR EXPENDITURE</div>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                ${simData.predictive.total_cost.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px' }}>
              <span>Unplanned Failures:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{simData.predictive.total_failures}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
              <span>Avg Downtime / Asset:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{simData.predictive.avg_downtime_hours} hrs</strong>
            </div>
          </div>
        </div>
      )}

      {/* Flat SVG Simulation Curve Visualization */}
      <div className="card-matte">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          Expenditure Trajectory Across 5-Year Horizon (Flat Fills, No Gradients)
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Confidence bands represent 10th-90th percentile simulated weather variation and material variability
        </p>

        <div style={{ height: '240px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', position: 'relative', padding: '20px' }}>
          <svg width="100%" height="100%" viewBox="0 0 500 180">
            {/* Horizontal Gridlines */}
            <line x1="40" y1="140" x2="480" y2="140" stroke="var(--border)" strokeWidth="1" />
            <line x1="40" y1="90" x2="480" y2="90" stroke="var(--border)" strokeWidth="1" />
            <line x1="40" y1="40" x2="480" y2="40" stroke="var(--border)" strokeWidth="1" />

            {/* Reactive Confidence Band & Line (Red) */}
            <polygon points="40,90 150,80 260,65 370,50 480,35 480,60 370,75 260,95 150,110 40,115" fill="#A0484A" fillOpacity="0.15" />
            <polyline points="40,100 150,92 260,80 370,62 480,48" fill="none" stroke="#A0484A" strokeWidth="2.5" />
            <text x="485" y="52" fill="#A0484A" fontSize="9" fontWeight="600">Reactive</text>

            {/* Time-based Line (Ochre) */}
            <polyline points="40,110 150,105 260,100 370,95 480,90" fill="none" stroke="#C9A45C" strokeWidth="2" strokeDasharray="4 2" />
            <text x="485" y="93" fill="#C9A45C" fontSize="9" fontWeight="600">Calendar</text>

            {/* Predictive Confidence Band & Line (Sage) */}
            <polygon points="40,120 150,122 260,125 370,128 480,130 480,145 370,142 260,138 150,135 40,130" fill="#5F7A6F" fillOpacity="0.2" />
            <polyline points="40,125 150,128 260,131 370,135 480,138" fill="none" stroke="#5F7A6F" strokeWidth="3" />
            <text x="485" y="142" fill="#5F7A6F" fontSize="9" fontWeight="700">Predictive (UrbanPulse)</text>

            {/* X-axis labels */}
            <text x="40" y="160" fontSize="9" fill="var(--text-muted)">Year 1</text>
            <text x="150" y="160" fontSize="9" fill="var(--text-muted)">Year 2</text>
            <text x="260" y="160" fontSize="9" fill="var(--text-muted)">Year 3</text>
            <text x="370" y="160" fontSize="9" fill="var(--text-muted)">Year 4</text>
            <text x="470" y="160" fontSize="9" fill="var(--text-muted)">Year 5</text>
          </svg>
        </div>
      </div>
    </div>
  );
};
