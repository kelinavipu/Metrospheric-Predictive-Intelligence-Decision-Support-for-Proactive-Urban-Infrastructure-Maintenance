/**
 * UrbanPulse Global State Store
 * Pure TypeScript store built with useSyncExternalStore (zero dependencies).
 */

import { useSyncExternalStore } from 'react';

export type PageTab =
  | 'command-center'
  | 'assets'
  | 'complaints'
  | 'predictive'
  | 'priority'
  | 'planner'
  | 'simulator'
  | 'sensors'
  | 'wards'
  | 'admin'
  | 'citizen'
  | 'field'
  | 'tokens';

export type UserRole = 'citizen' | 'admin';

interface State {
  role: UserRole;
  theme: 'light' | 'dark';
  activeTab: PageTab;
  selectedAssetId: string | null;
  selectedComplaintId: string | null;
  timeHorizon: 30 | 90 | 180;
  filters: {
    wardId?: string;
    assetType?: string;
    riskBand?: string;
  };
  liveAlertCount: number;
}

let state: State = {
  role: 'citizen',
  theme: 'light',
  activeTab: 'command-center',
  selectedAssetId: null,
  selectedComplaintId: null,
  timeHorizon: 90,
  filters: {},
  liveAlertCount: 3,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const store = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setTheme: (theme: 'light' | 'dark') => {
    state = { ...state, theme };
    document.documentElement.setAttribute('data-theme', theme);
    emitChange();
  },
  toggleTheme: () => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    store.setTheme(next);
  },
  setRole: (role: UserRole) => {
    state = { ...state, role };
    emitChange();
  },
  setSelectedComplaintId: (selectedComplaintId: string | null) => {
    state = { ...state, selectedComplaintId };
    emitChange();
  },
  setActiveTab: (activeTab: PageTab) => {
    state = { ...state, activeTab };
    emitChange();
  },
  setSelectedAssetId: (selectedAssetId: string | null) => {
    state = { ...state, selectedAssetId };
    emitChange();
  },
  setTimeHorizon: (timeHorizon: 30 | 90 | 180) => {
    state = { ...state, timeHorizon };
    emitChange();
  },
  setFilters: (filters: Partial<State['filters']>) => {
    state = { ...state, filters: { ...state.filters, ...filters } };
    emitChange();
  },
  clearFilters: () => {
    state = { ...state, filters: {} };
    emitChange();
  },
  setLiveAlertCount: (count: number) => {
    state = { ...state, liveAlertCount: count };
    emitChange();
  }
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  );
}
