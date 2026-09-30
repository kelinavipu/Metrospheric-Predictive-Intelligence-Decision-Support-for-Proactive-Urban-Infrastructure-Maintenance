import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Building2, AlertTriangle, Users, TrendingUp } from 'lucide-react';

export const WardEquity: React.FC = () => {
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    loadWards();
  }, []);

  const loadWards = async () => {
    try {
      const data = await api.getWardKPIs();
      setWards(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-matte">
        <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} style={{ color: 'var(--accent)' }} />
          Ward & Municipal Equity Insights
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Spatial equity analysis ensuring capital maintenance is distributed fairly across demographic vulnerabilities
        </p>
      </div>

      <div className="card-matte">
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Ward Equity Scorecard</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
              <th style={{ padding: '8px' }}>WARD ID</th>
              <th style={{ padding: '8px' }}>NAME</th>
              <th style={{ padding: '8px' }}>POPULATION</th>
              <th style={{ padding: '8px' }}>AVG HEALTH</th>
              <th style={{ padding: '8px' }}>CRITICAL ASSETS</th>
              <th style={{ padding: '8px' }}>BACKLOG COST</th>
              <th style={{ padding: '8px' }}>COMPLAINTS / 1K</th>
              <th style={{ padding: '8px' }}>RESP TIME (HRS)</th>
              <th style={{ padding: '8px' }}>EQUITY INDEX</th>
            </tr>
          </thead>
          <tbody>
            {wards.map(w => (
              <tr key={w.ward_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{w.ward_id}</td>
                <td style={{ padding: '10px 8px', fontWeight: 500 }}>{w.name}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{w.population.toLocaleString()}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{w.avg_health}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>
                  <span className={`badge-risk badge-risk-${w.critical_assets > 0 ? 'critical' : 'low'}`}>
                    {w.critical_assets}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>${w.backlog_cost.toLocaleString()}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{w.complaints_per_1k}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{w.avg_response_hours} hrs</td>
                <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>
                  {w.equity_investment_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
