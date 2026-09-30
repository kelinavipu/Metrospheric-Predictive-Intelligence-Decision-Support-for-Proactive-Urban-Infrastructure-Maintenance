import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Send, CheckCircle2, MapPin, Search } from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const [complaintText, setComplaintText] = useState(
    'Water is bubbling up near the bus stop opposite City Hospital on MG Road, been there since morning, road is getting slippery.'
  );
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.submitComplaint({
        raw_text: complaintText,
        channel: 'citizen_portal',
        lat: 12.9716,
        lon: 77.5946
      });
      setSubmittedResult(res);
    } catch (e) {
      console.error(e);
      alert('Error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-matte">
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Citizen Infrastructure Report Portal</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Report municipal issues directly. Our AI parses defects, links nearby assets, and dispatches field teams.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Describe the issue and location:
            </label>
            <textarea
              value={complaintText}
              onChange={e => setComplaintText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                fontSize: '13px',
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
                resize: 'none'
              }}
              placeholder="e.g. Broken water pipe leaking opposite City Hospital on MG Road..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <MapPin size={14} style={{ color: 'var(--accent)' }} />
              <span>Location: MG Road near City Hospital (12.9716, 77.5946)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-matte"
            style={{ alignSelf: 'flex-start' }}
          >
            <Send size={13} />
            <span>{submitting ? 'Submitting & Classifying...' : 'Submit Report'}</span>
          </button>
        </form>
      </div>

      {submittedResult && (
        <div className="card-matte" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
            <CheckCircle2 size={16} />
            <span>Report Successfully Logged & Analyzed</span>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div>Tracking ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{submittedResult.complaint_id}</strong></div>
            <div>Detected Category: <span className="badge-risk badge-risk-high">{submittedResult.category?.replace('_', ' ').toUpperCase()}</span></div>
            <div>Severity Rating: <strong>Level {submittedResult.severity} / 4 ({submittedResult.urgency?.toUpperCase()})</strong></div>
            {submittedResult.linked_asset_id && (
              <div>Linked City Asset: <strong style={{ fontFamily: 'var(--font-mono)' }}>{submittedResult.linked_asset_id}</strong></div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Your report has been routed into the predictive dispatch queue. Thank you for helping keep the city safe.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
