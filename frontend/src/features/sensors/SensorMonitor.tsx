import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Radio, AlertTriangle, Play, Pause, Activity } from 'lucide-react';

export const SensorMonitor: React.FC = () => {
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string>('SN-042');
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    loadSensors();
  }, []);

  useEffect(() => {
    if (selectedSensor) {
      loadSeries(selectedSensor);
    }
  }, [selectedSensor]);

  const loadSensors = async () => {
    try {
      const data = await api.getSensors();
      setSensors(data);
      if (data.length > 0 && !selectedSensor) {
        setSelectedSensor(data[0].sensor_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSeries = async (sensorId: string) => {
    try {
      const res = await api.getSensorSeries(sensorId, 40);
      setSeriesData(res.series || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} style={{ color: 'var(--accent)' }} />
              IoT Sensor Telemetry & Anomaly Stream
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              15% equipped assets (water mains, bridges, signals, arterials) streaming vibration, pressure, and acoustic signals
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STATUS:</span>
            <span className="badge-risk badge-risk-low" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} />
              {isLive ? 'STREAMING ACTIVE' : 'PAUSED'}
            </span>
            <button
              onClick={() => setIsLive(!isLive)}
              className="btn-matte-secondary"
              style={{ fontSize: '12px' }}
            >
              {isLive ? <Pause size={12} /> : <Play size={12} />}
              <span>{isLive ? 'Pause' : 'Resume'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Tiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {sensors.map(s => {
          const isSelected = selectedSensor === s.sensor_id;
          return (
            <div
              key={s.sensor_id}
              onClick={() => setSelectedSensor(s.sensor_id)}
              className="card-matte"
              style={{
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px' }}>{s.sensor_id}</span>
                <span className={`badge-risk badge-risk-${s.is_anomaly ? 'critical' : 'low'}`}>
                  {s.is_anomaly ? 'ANOMALY' : 'NOMINAL'}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '6px' }}>{s.asset_name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.asset_type.replace('_', ' ')} • {s.metric}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                {s.current_value} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>psi / mm</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Selected Sensor Chart */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              Live Telemetry Stream: {selectedSensor}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Autoencoder dynamic threshold monitoring with reconstruction error deviation flags
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent)', borderRadius: '50%' }} /> Nominal Reading
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--risk-critical)', borderRadius: '50%' }} /> Anomaly Threshold Breach
            </span>
          </div>
        </div>

        <div style={{ height: '260px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', position: 'relative', padding: '20px' }}>
          <svg width="100%" height="100%" viewBox="0 0 600 200">
            {/* Threshold Line */}
            <line x1="40" y1="60" x2="580" y2="60" stroke="var(--risk-critical)" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="585" y="63" fontSize="9" fill="var(--risk-critical)">Adaptive Threshold (65 psi)</text>

            {/* Baseline nominal axis */}
            <line x1="40" y1="170" x2="580" y2="170" stroke="var(--border)" strokeWidth="1" />

            {/* Series points and polyline */}
            {seriesData.length > 1 && (
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                points={seriesData.map((pt, i) => {
                  const x = 40 + (i / (seriesData.length - 1)) * 520;
                  const y = 170 - (pt.value / 100) * 140;
                  return `${x},${y}`;
                }).join(' ')}
              />
            )}

            {seriesData.map((pt, i) => {
              const x = 40 + (i / (seriesData.length - 1)) * 520;
              const y = 170 - (pt.value / 100) * 140;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={pt.is_anomaly ? 5 : 2.5}
                  fill={pt.is_anomaly ? 'var(--risk-critical)' : 'var(--accent)'}
                />
              );
            })}

            <text x="300" y="195" fontSize="10" fill="var(--text-muted)" textAnchor="middle">Accelerated Real-Time Buffer Window</text>
          </svg>
        </div>
      </div>
    </div>
  );
};
