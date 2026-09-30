import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SlidersHorizontal, ArrowUp, ArrowDown, ShieldAlert, CheckCircle, Edit3 } from 'lucide-react';

export const PrioritizationBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'ranking' | 'kanban'>('ranking');
  const [ranking, setRanking] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [weights, setWeights] = useState({
    likelihood: 0.35,
    consequence: 0.35,
    safety: 0.15,
    equity: 0.10,
    cost_effectiveness: 0.05
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rData, wData] = await Promise.all([
        api.getRiskRanking(20),
        api.getWorkOrders()
      ]);
      setRanking(rData);
      setWorkOrders(wData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWeightChange = (key: string, val: number) => {
    setWeights(prev => ({ ...prev, [key]: val }));
    // Simulate live re-ranking based on dynamic weight adjustments
    setRanking(prev => {
      return [...prev].sort((a, b) => {
        const scoreA = a.likelihood * weights.likelihood + a.consequence * weights.consequence + (a.risk_band === 'critical' ? weights.safety : 0);
        const scoreB = b.likelihood * weights.likelihood + b.consequence * weights.consequence + (b.risk_band === 'critical' ? weights.safety : 0);
        return scoreB - scoreA;
      }).map((item, idx) => ({ ...item, priority_rank: idx + 1 }));
    });
  };

  const handleOverride = async (assetId: string) => {
    const band = prompt(`Enter new risk band for ${assetId} (low, moderate, high, critical):`, 'critical');
    if (!band) return;
    const rationale = prompt('Enter override rationale:', 'Field inspection identified accelerated settlement');
    if (!rationale) return;

    await api.overrideRisk({ asset_id: assetId, override_band: band, rationale });
    alert(`Risk band for ${assetId} overridden to ${band}`);
    loadData();
  };

  const handleUpdateStatus = async (woId: string, nextStatus: string) => {
    if (nextStatus === 'approved') await api.approveWorkOrder(woId);
    else if (nextStatus === 'in_progress') await api.startWorkOrder(woId);
    else if (nextStatus === 'completed') await api.completeWorkOrder(woId);
    loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Bar */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} style={{ color: 'var(--accent)' }} />
              Prioritization Board & Decision Support
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Risk = Likelihood x Consequence with multi-criteria AHP weight sliders and live re-ranking
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('ranking')}
              className={viewMode === 'ranking' ? 'btn-matte' : 'btn-matte-secondary'}
              style={{ fontSize: '12px' }}
            >
              Priority Ranking
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban' ? 'btn-matte' : 'btn-matte-secondary'}
              style={{ fontSize: '12px' }}
            >
              Kanban Dispatch
            </button>
          </div>
        </div>

        {/* Multi-Criteria Weight Sliders */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
            LIVE MULTI-CRITERIA DECISION WEIGHTS:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Likelihood</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(weights.likelihood * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.likelihood}
                onChange={e => handleWeightChange('likelihood', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Consequence</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(weights.consequence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.consequence}
                onChange={e => handleWeightChange('consequence', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Safety Override</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(weights.safety * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.safety}
                onChange={e => handleWeightChange('safety', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Ward Equity</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(weights.equity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.05"
                value={weights.equity}
                onChange={e => handleWeightChange('equity', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Cost Efficiency</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(weights.cost_effectiveness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.3"
                step="0.05"
                value={weights.cost_effectiveness}
                onChange={e => handleWeightChange('cost_effectiveness', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Ranking Table or Kanban */}
      {viewMode === 'ranking' ? (
        <div className="card-matte">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                <th style={{ padding: '8px' }}>RANK</th>
                <th style={{ padding: '8px' }}>ASSET ID</th>
                <th style={{ padding: '8px' }}>NAME</th>
                <th style={{ padding: '8px' }}>TYPE</th>
                <th style={{ padding: '8px' }}>LIKELIHOOD</th>
                <th style={{ padding: '8px' }}>CONSEQUENCE</th>
                <th style={{ padding: '8px' }}>RISK SCORE</th>
                <th style={{ padding: '8px' }}>BAND</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>OVERRIDE</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, idx) => (
                <tr key={item.asset_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    #{item.priority_rank}
                  </td>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{item.asset_id}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{item.asset_type.replace('_', ' ')}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{(item.likelihood * 100).toFixed(1)}%</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{(item.consequence * 100).toFixed(1)}%</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.risk_score.toFixed(3)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={`badge-risk badge-risk-${item.risk_band}`}>{item.risk_band}</span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOverride(item.asset_id)}
                      className="btn-matte-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Edit3 size={11} />
                      <span>Audit Override</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban Dispatch View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {(['proposed', 'approved', 'scheduled', 'in_progress', 'completed'] as const).map(col => {
            const colOrders = workOrders.filter(w => w.status === col);
            return (
              <div key={col} className="card-matte" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{col.replace('_', ' ')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{colOrders.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {colOrders.map(wo => (
                    <div key={wo.wo_id} className="card-matte-inset" style={{ fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{wo.wo_id}</span>
                        <span>${wo.est_cost}</span>
                      </div>
                      <div style={{ marginTop: '4px', color: 'var(--text)' }}>{wo.rationale}</div>
                      <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>Crew: {wo.crew_id || 'TBD'}</div>

                      {/* Progression buttons */}
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                        {col === 'proposed' && (
                          <button
                            onClick={() => handleUpdateStatus(wo.wo_id, 'approved')}
                            className="btn-matte"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            Approve
                          </button>
                        )}
                        {col === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(wo.wo_id, 'in_progress')}
                            className="btn-matte"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            Dispatch Crew
                          </button>
                        )}
                        {col === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(wo.wo_id, 'completed')}
                            className="btn-matte"
                            style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: 'var(--risk-low)' }}
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
