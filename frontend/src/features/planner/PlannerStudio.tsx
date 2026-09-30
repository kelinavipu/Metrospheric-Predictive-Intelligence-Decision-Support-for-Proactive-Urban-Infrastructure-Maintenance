import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Route, DollarSign, Calendar, Truck, CheckCircle2, Play } from 'lucide-react';

export const PlannerStudio: React.FC = () => {
  const [budget, setBudget] = useState(350000);
  const [minSpendWard, setMinSpendWard] = useState(2500);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    handleRunOptimization();
  }, []);

  const handleRunOptimization = async () => {
    setOptimizing(true);
    try {
      const [optData, routeData] = await Promise.all([
        api.optimizeBudget({ total_budget: budget, min_spend_per_ward: minSpendWard }),
        api.getCrewRoutes().catch(() => [])
      ]);
      setResult(optData);
      setRoutes(routeData);
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!result?.interventions) return;
    for (const item of result.interventions.slice(0, 3)) {
      await api.createWorkOrder({
        asset_ids: [item.asset_id],
        type: item.action,
        est_cost: item.cost,
        est_hours: item.est_hours,
        status: 'scheduled',
        rationale: `Funded via MILP Optimization (${item.action.toUpperCase()})`
      });
    }
    alert('Plan approved! Scheduled 3 bundled work orders for Alpha Utility Crew.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Configuration Bar */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Route size={18} style={{ color: 'var(--accent)' }} />
              Planner Studio (MILP Knapsack & VRP Routing)
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Maximize system-wide risk reduction subject to budget ceilings, equity floors per ward, and corridor bundling
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRunOptimization}
              disabled={optimizing}
              className="btn-matte"
              style={{ fontSize: '12px' }}
            >
              <Play size={13} />
              <span>{optimizing ? 'Optimizing...' : 'Run Optimization'}</span>
            </button>
            <button
              onClick={handleApprovePlan}
              className="btn-matte-secondary"
              style={{ fontSize: '12px' }}
            >
              <CheckCircle2 size={13} style={{ color: 'var(--risk-low)' }} />
              <span>Approve & Schedule Plan</span>
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL BUDGET CEILING ($)</div>
            <input
              type="number"
              value={budget}
              step="25000"
              onChange={e => setBudget(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '13px',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>MIN EQUITY FLOOR PER WARD ($)</div>
            <input
              type="number"
              value={minSpendWard}
              step="500"
              onChange={e => setMinSpendWard(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '13px',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PLANNING HORIZON</div>
            <div style={{ fontSize: '13px', fontWeight: 600, padding: '6px 0', fontFamily: 'var(--font-mono)' }}>90 Days (Q4 Rolling)</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ACTIVE CREWS AVAILABLE</div>
            <div style={{ fontSize: '13px', fontWeight: 600, padding: '6px 0', fontFamily: 'var(--font-mono)' }}>2 Dedicated Field Teams</div>
          </div>
        </div>
      </div>

      {/* Optimization Outcomes Summary */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div className="card-matte">
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ALLOCATED SPEND</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              ${result.total_allocated.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              of ${budget.toLocaleString()} available
            </div>
          </div>

          <div className="card-matte">
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL RISK REDUCTION</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--accent)' }}>
              {result.total_risk_reduced} pts
            </div>
            <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '4px' }}>74% expected failure avoidance</div>
          </div>

          <div className="card-matte">
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>BENEFIT-COST MULTIPLE (ROI)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {result.roi_multiple}x
            </div>
            <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '4px' }}>$1 spend yields ${result.roi_multiple} value</div>
          </div>

          <div className="card-matte">
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>INTERVENTIONS FUNDED</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {result.interventions.length} Assets
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Corridor bundled on MG Road</div>
          </div>
        </div>
      )}

      {/* Dual Section: Crew Route Dispatch & Intervention Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Crew Daily Routes (Corridor Bundling) */}
        <div className="card-matte">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            Vehicle Routing & Corridor Bundling (VRP Schedule)
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Adjacent maintenance tasks bundled along MG Road to coordinate road resurfacing with pipe replacement
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {routes.map(crew => (
              <div key={crew.crew_id} className="card-matte-inset">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={15} style={{ color: crew.color }} />
                    {crew.crew_name} ({crew.crew_id})
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Shift: {crew.shift}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {crew.stops.map((stop: any) => (
                    <div
                      key={stop.stop_num}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                            color: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {stop.stop_num}
                        </span>
                        <div>
                          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{stop.asset_id}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({stop.street})</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 500 }}>{stop.action}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{stop.est_hours} hrs</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funded Interventions Table */}
        <div className="card-matte" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Funded Priority Interventions</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px' }}>ASSET</th>
                  <th style={{ padding: '6px' }}>ACTION</th>
                  <th style={{ padding: '6px' }}>COST</th>
                  <th style={{ padding: '6px' }}>RISK RED</th>
                  <th style={{ padding: '6px' }}>BCR</th>
                </tr>
              </thead>
              <tbody>
                {result?.interventions?.slice(0, 8).map((item: any) => (
                  <tr key={item.asset_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{item.asset_id}</td>
                    <td style={{ padding: '8px 6px', textTransform: 'capitalize' }}>{item.action}</td>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>${item.cost}</td>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{item.risk_reduction}</td>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)', color: 'var(--risk-low)' }}>{item.benefit_cost_ratio}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
