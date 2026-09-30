/**
 * UrbanPulse API Client
 * Typed fetch client with standardized error handling.
 */

const BASE_URL = '/api/v1';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errMsg = `API error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMsg = errData.detail;
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // KPIs
  getKPISummary: () => fetchJSON<any>('/kpi/summary'),
  getKPITrends: () => fetchJSON<any>('/kpi/trends'),
  getWardKPIs: () => fetchJSON<any[]>('/kpi/wards'),

  // Assets
  getAssets: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchJSON<any[]>(`/assets${qs}`);
  },
  getAssetDetail: (id: string) => fetchJSON<any>(`/assets/${id}`),
  getGeoJSON: (limit = 3000) => fetchJSON<any>(`/assets/geojson?limit=${limit}`),
  getWards: () => fetchJSON<any[]>('/assets/wards'),

  // Complaints & NLP
  getComplaints: (limit = 100) => fetchJSON<any[]>(`/complaints?limit=${limit}`),
  submitComplaint: (data: any) => fetchJSON<any>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaintStatus: (id: string, status: string, notes?: string) =>
    fetchJSON<any>(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  reviewComplaint: (id: string, data: any) => fetchJSON<any>(`/complaints/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  analyzeNLP: (text: string, lat?: number, lon?: number) =>
    fetchJSON<any>('/nlp/analyze', { method: 'POST', body: JSON.stringify({ text, lat, lon }) }),
  suggestNLP: (text: string, lat?: number, lon?: number) =>
    fetchJSON<any>('/nlp/suggest', { method: 'POST', body: JSON.stringify({ text, lat, lon }) }),
  trainNLPModel: () =>
    fetchJSON<any>('/nlp/train', { method: 'POST' }),
  getSpatialOntology: () =>
    fetchJSON<any>('/nlp/ontology'),
  getNLPMetrics: () => fetchJSON<any>('/nlp/metrics'),
  getDatabaseSummary: () => fetchJSON<any>('/complaints/database/summary'),
  downloadCSVDatabaseUrl: () => `${BASE_URL}/complaints/export/csv`,

  // Predictions & Survival
  getPrediction: (id: string) => fetchJSON<any>(`/predictions/${id}`),
  getSurvivalCurve: (id: string) => fetchJSON<any>(`/predictions/survival/${id}`),
  getExplanation: (id: string) => fetchJSON<any>(`/predictions/${id}/explain`),
  getTopFailures: (limit = 10) => fetchJSON<any[]>(`/predictions/top/failures?limit=${limit}`),

  // Risk & Prioritization
  getRiskRanking: (limit = 50) => fetchJSON<any[]>(`/risk/ranking?limit=${limit}`),
  getWeights: () => fetchJSON<any>('/risk/weights'),
  updateWeights: (weights: any) => fetchJSON<any>('/risk/weights', { method: 'PUT', body: JSON.stringify(weights) }),
  overrideRisk: (data: any) => fetchJSON<any>('/risk/override', { method: 'POST', body: JSON.stringify(data) }),

  // Optimization & Simulation
  optimizeBudget: (data: any) => fetchJSON<any>('/optimize/budget', { method: 'POST', body: JSON.stringify(data) }),
  runSimulation: (data: any) => fetchJSON<any>('/optimize/simulate', { method: 'POST', body: JSON.stringify(data) }),
  getCrewRoutes: () => fetchJSON<any[]>('/optimize/routes'),

  // Work Orders
  getWorkOrders: (status?: string) => fetchJSON<any[]>(`/work-orders${status ? `?status=${status}` : ''}`),
  createWorkOrder: (data: any) => fetchJSON<any>('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  approveWorkOrder: (id: string) => fetchJSON<any>(`/work-orders/${id}/approve`, { method: 'POST' }),
  startWorkOrder: (id: string) => fetchJSON<any>(`/work-orders/${id}/start`, { method: 'POST' }),
  completeWorkOrder: (id: string) => fetchJSON<any>(`/work-orders/${id}/complete`, { method: 'POST' }),

  // Sensors & Alerts
  getSensors: () => fetchJSON<any[]>('/sensors'),
  getSensorSeries: (id: string, limit = 60) => fetchJSON<any>(`/sensors/${id}/series?limit=${limit}`),
  getAlerts: () => fetchJSON<any[]>('/alerts'),
  acknowledgeAlert: (id: string) => fetchJSON<any>(`/alerts/${id}/ack`, { method: 'POST', body: JSON.stringify({ acknowledged_by: 'User' }) }),

  // Models & Health
  getModels: () => fetchJSON<any[]>('/models'),
  getDataQuality: () => fetchJSON<any>('/data-quality'),
};
