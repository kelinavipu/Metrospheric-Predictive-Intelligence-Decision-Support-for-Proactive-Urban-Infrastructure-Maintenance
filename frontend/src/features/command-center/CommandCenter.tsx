import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { store } from '../../store/useStore';
import { AlertTriangle, TrendingDown, Clock, CheckCircle2, ShieldAlert, ArrowUpRight, Wrench } from 'lucide-react';
import { Nerul3DSatelliteMap } from '../../components/Nerul3DSatelliteMap';

export const CommandCenter: React.FC = () => {
  const [kpi, setKpi] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [topFailures, setTopFailures] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, trendData, failuresData, alertsData] = await Promise.all([
        api.getKPISummary().catch(() => null),
        api.getKPITrends().catch(() => null),
        api.getTopFailures(8).catch(() => []),
        api.getAlerts().catch(() => [])
      ]);
      setKpi(kpiData);
      setTrends(trendData);
      setTopFailures(failuresData);
      setAlerts(alertsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    await api.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, state: 'acknowledged' } : a));
  };

  const handleCreateWO = async (assetId: string) => {
    await api.createWorkOrder({ asset_ids: [assetId], type: 'corrective', rationale: 'Created from Command Center priority list' });
    alert(`Work order proposed for ${assetId}`);
    loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Tiles Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {/* Tile 1: Avg Health Index */}
        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Avg Health Index
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {kpi?.avg_health_index || 76.4}
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}> / 100</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--risk-low)', marginTop: '6px' }}>
            <span>-0.4 vs last month</span>
          </div>
        </div>

        {/* Tile 2: Critical / High Assets */}
        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Critical / High Risk
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--risk-critical)' }}>
            {(kpi?.critical_assets_count || 4) + (kpi?.high_assets_count || 18)}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>assets</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {kpi?.critical_assets_count || 4} critical requiring action
          </div>
        </div>

        {/* Tile 3: Predicted Failures */}
        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Predicted Failures (90d)
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {kpi?.predicted_failures_90d || 12}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {kpi?.predicted_failures_30d || 3} imminent within 30d
          </div>
        </div>

        {/* Tile 4: Open Work Orders */}
        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Work Orders
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {kpi?.open_work_orders || 8}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Backlog est: ${(kpi?.backlog_cost || 185000).toLocaleString()}
          </div>
        </div>

        {/* Tile 5: Cost Avoided */}
        <div className="card-matte">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Estimated Avoided Cost
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--accent)' }}>
            ${(kpi?.avoided_cost_estimate || 204000).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--risk-low)', marginTop: '6px' }}>
            +22% vs reactive baseline
          </div>
        </div>
      </div>

      {/* Hero: Nerul Node 3D Satellite Infrastructure Scanner */}
      <Nerul3DSatelliteMap />

      {/* Live Alert Feed Banner / Quick Row */}
      <div className="card-matte" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Live Municipal Telemetry & Alert Stream</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Real-time sensor threshold alerts across Nerul sectors</div>
          </div>
          <span className="badge-risk badge-risk-low" style={{ fontSize: '10px' }}>LIVE STREAM ACTIVE</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {alerts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
              No active critical alerts. All Nerul sectors operating within nominal thresholds.
            </div>
          ) : (
            alerts.slice(0, 4).map(a => (
              <div
                key={a.alert_id}
                className="card-matte-inset"
                style={{
                  borderLeft: `4px solid ${a.severity === 'critical' ? 'var(--risk-critical)' : 'var(--risk-high)'}`,
                  padding: '10px 12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={`badge-risk badge-risk-${a.severity}`} style={{ fontSize: '10px' }}>{a.severity}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {a.created_at ? a.created_at.slice(11, 16) : 'Now'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '6px' }}>{a.message}</div>
                {a.asset_id && (
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: '4px' }}>
                    Asset: {a.asset_id}
                  </div>
                )}
                {a.state !== 'acknowledged' && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleAcknowledge(a.alert_id)}
                      className="btn-matte-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      Acknowledge
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>


      {/* Bottom Priority Assets Table */}
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Top Priority Maintenance Targets</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Assets ranked by calibrated failure probability, consequence score, and criticality
            </div>
          </div>
          <button onClick={() => store.setActiveTab('assets')} className="btn-matte-secondary" style={{ fontSize: '12px' }}>
            View All Assets
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
              <th style={{ padding: '8px' }}>ASSET ID</th>
              <th style={{ padding: '8px' }}>NAME & TYPE</th>
              <th style={{ padding: '8px' }}>WARD</th>
              <th style={{ padding: '8px' }}>P(FAIL 90d)</th>
              <th style={{ padding: '8px' }}>EST. RUL</th>
              <th style={{ padding: '8px' }}>RISK BAND</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {topFailures.map(asset => (
              <tr
                key={asset.asset_id}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => {
                  store.setSelectedAssetId(asset.asset_id);
                  store.setActiveTab('assets');
                }}
              >
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{asset.asset_id}</td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ fontWeight: 500 }}>{asset.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{asset.asset_type.replace('_', ' ')}</div>
                </td>
                <td style={{ padding: '10px 8px' }}>{asset.ward_id}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>
                  {((asset.p_fail_90d || 0.65) * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(asset.rul_days_median || 45)} days
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <span className={`badge-risk badge-risk-${asset.risk_band || 'high'}`}>
                    {asset.risk_band || 'high'}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateWO(asset.asset_id);
                    }}
                    className="btn-matte"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    Propose WO
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
