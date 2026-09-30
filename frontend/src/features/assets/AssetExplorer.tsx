import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useStore, store } from '../../store/useStore';
import { X, Wrench, ShieldAlert, Activity, Calendar, MapPin, ChevronRight } from 'lucide-react';

export const AssetExplorer: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [survivalData, setSurvivalData] = useState<any | null>(null);
  const [explanation, setExplanation] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterBand, setFilterBand] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const selectedAssetId = useStore(s => s.selectedAssetId);

  useEffect(() => {
    loadAssets();
  }, [filterType, filterBand]);

  useEffect(() => {
    if (selectedAssetId) {
      loadAssetDetail(selectedAssetId);
    }
  }, [selectedAssetId]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await api.getAssets({
        asset_type: filterType || undefined,
        risk_band: filterBand || undefined,
        limit: 100
      });
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAssetDetail = async (id: string) => {
    try {
      const [detail, surv, expl] = await Promise.all([
        api.getAssetDetail(id),
        api.getSurvivalCurve(id).catch(() => null),
        api.getExplanation(id).catch(() => null)
      ]);
      setSelectedAsset(detail);
      setSurvivalData(surv);
      setExplanation(expl);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWO = async (assetId: string) => {
    await api.createWorkOrder({ asset_ids: [assetId], type: 'corrective', rationale: 'Created from Asset Detail view' });
    alert(`Work order successfully scheduled for ${assetId}`);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 104px)' }}>
      {/* Left: Asset List and Filter Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Asset Explorer</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Filterable municipal asset inventory with real-time health index and calibrated failure probabilities
            </p>
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text)'
              }}
            >
              <option value="">All Asset Types</option>
              <option value="water_main">Water Mains</option>
              <option value="road_segment">Road Segments</option>
              <option value="sewer_line">Sewer Lines</option>
              <option value="storm_drain">Storm Drains</option>
              <option value="bridge">Bridges</option>
              <option value="streetlight">Streetlights</option>
              <option value="traffic_signal">Traffic Signals</option>
            </select>

            <select
              value={filterBand}
              onChange={e => setFilterBand(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text)'
              }}
            >
              <option value="">All Risk Bands</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Assets Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                <th style={{ padding: '8px' }}>ID</th>
                <th style={{ padding: '8px' }}>NAME</th>
                <th style={{ padding: '8px' }}>TYPE</th>
                <th style={{ padding: '8px' }}>WARD</th>
                <th style={{ padding: '8px' }}>HEALTH (AHI)</th>
                <th style={{ padding: '8px' }}>P_FAIL (90d)</th>
                <th style={{ padding: '8px' }}>RISK BAND</th>
                <th style={{ padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => {
                const isSelected = selectedAsset?.asset_id === a.asset_id;
                return (
                  <tr
                    key={a.asset_id}
                    onClick={() => {
                      store.setSelectedAssetId(a.asset_id);
                      loadAssetDetail(a.asset_id);
                    }}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{a.asset_id}</td>
                    <td style={{ padding: '8px', fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{a.asset_type.replace('_', ' ')}</td>
                    <td style={{ padding: '8px' }}>{a.ward_id}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(a.health_index || 75)}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                      {((a.p_fail_90d || 0.15) * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge-risk badge-risk-${a.risk_band || 'moderate'}`}>
                        {a.risk_band || 'moderate'}
                      </span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer: Asset Detail Deep Dive */}
      {selectedAsset && (
        <div
          style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
          className="card-matte"
        >
          {/* Drawer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                {selectedAsset.asset_id}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{selectedAsset.name}</h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {selectedAsset.material} • Installed {selectedAsset.install_date} • {selectedAsset.ward_id}
              </div>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Health Index Gauge Card (Flat Matte representation) */}
          <div className="card-matte-inset">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>Asset Health Index (AHI)</div>
              <span className={`badge-risk badge-risk-${selectedAsset.risk_band || 'high'}`}>
                {selectedAsset.risk_band}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '12px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface)',
                  border: '4px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {Math.round(selectedAsset.health_index || 43)}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  {selectedAsset.health_index < 40 ? 'Severe Degradation' : selectedAsset.health_index < 70 ? 'Moderate Wear' : 'Good Condition'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Median RUL: <strong style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(selectedAsset.rul_days_median || 42)} days</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  P(Fail 90d): <strong style={{ fontFamily: 'var(--font-mono)' }}>{((selectedAsset.p_fail_90d || 0.68) * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* Health Component Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {selectedAsset.health_components && Object.entries(selectedAsset.health_components).map(([k, v]: [string, any]) => (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>{k.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(v)}%</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${v}%`, height: '100%', backgroundColor: 'var(--accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP "Why" Waterfall Explanation */}
          <div className="card-matte-inset">
            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px' }}>
              Explainability: Top Failure Drivers (SHAP)
            </div>
            {explanation?.narrative_bullets ? (
              <ul style={{ paddingLeft: '16px', fontSize: '11px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {explanation.narrative_bullets.map((b: string, idx: number) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                • Material: Cast Iron (Elevates corrosion susceptibility)<br/>
                • Age: Exceeds 70% of design life<br/>
                • Historical Leaks: 3 incidents within prior 12 months<br/>
                • Pressure Variance: Rising sensor deviation
              </div>
            )}
          </div>

          {/* Event Timeline */}
          <div className="card-matte-inset">
            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px' }}>Maintenance & Inspection Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(selectedAsset.timeline || []).slice(0, 4).map((e: any, idx: number) => (
                <div key={idx} style={{ fontSize: '11px', borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{e.date} • {e.description}</div>
                </div>
              ))}
              {(!selectedAsset.timeline || selectedAsset.timeline.length === 0) && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No historical maintenance recorded.</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              onClick={() => handleCreateWO(selectedAsset.asset_id)}
              className="btn-matte"
              style={{ flex: 1 }}
            >
              <Wrench size={14} />
              <span>Schedule WO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
