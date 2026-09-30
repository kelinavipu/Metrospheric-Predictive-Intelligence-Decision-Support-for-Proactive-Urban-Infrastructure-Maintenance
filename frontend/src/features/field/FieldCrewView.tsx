import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Wrench, CheckCircle, Navigation, MapPin, Clock } from 'lucide-react';

export const FieldCrewView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getWorkOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (woId: string) => {
    await api.completeWorkOrder(woId);
    alert(`Work Order ${woId} marked complete! Asset health restored to 95 and failure probability reset.`);
    loadOrders();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card-matte">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={16} style={{ color: 'var(--accent)' }} />
              Field Crew Dispatch: Alpha Utility Team
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mobile Work Order Execution</div>
          </div>
          <span className="badge-risk badge-risk-low">ON SHIFT (DAY)</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {orders.map(wo => (
          <div
            key={wo.wo_id}
            className="card-matte"
            style={{
              borderLeft: `4px solid ${wo.status === 'completed' ? 'var(--risk-low)' : 'var(--accent)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>{wo.wo_id}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {wo.type.toUpperCase()}
                </span>
              </div>
              <span className={`badge-risk badge-risk-${wo.status === 'completed' ? 'low' : 'high'}`}>
                {wo.status}
              </span>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>
              {wo.rationale}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
              <span>Target Assets: <strong style={{ fontFamily: 'var(--font-mono)' }}>{(wo.asset_ids || []).join(', ')}</strong></span>
              <span>Est. Hours: <strong style={{ fontFamily: 'var(--font-mono)' }}>{wo.est_hours} hrs</strong></span>
            </div>

            {wo.status !== 'completed' && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert('Starting GPS navigation to MG Road corridor...')}
                  className="btn-matte-secondary"
                  style={{ fontSize: '11px', flex: 1 }}
                >
                  <Navigation size={12} />
                  <span>Navigate</span>
                </button>
                <button
                  onClick={() => handleComplete(wo.wo_id)}
                  className="btn-matte"
                  style={{ fontSize: '11px', flex: 1, backgroundColor: 'var(--risk-low)' }}
                >
                  <CheckCircle size={12} />
                  <span>Mark Done & Restore</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
