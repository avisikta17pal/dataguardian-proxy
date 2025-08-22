import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dataset, Rule, Stream, Token, AuditEvent, AppSettings } from '@/types';

// Auth Store
export const useAuthStore = create<{
  user: { id: string; email: string; name: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // Mock login - accept any credentials for demo
        if (email && password) {
          const user = {
            id: crypto.randomUUID(),
            email,
            name: email.split('@')[0]
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'dataguardian-auth',
    }
  )
);

// Dataset Store
export const useDatasetStore = create<{
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  selectDataset: (dataset: Dataset | null) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
}>()(
  persist(
    (set, get) => ({
      datasets: [],
      selectedDataset: null,
      addDataset: (dataset) => 
        set((state) => ({ datasets: [...state.datasets, dataset] })),
      removeDataset: (id) => 
        set((state) => ({ 
          datasets: state.datasets.filter(d => d.id !== id),
          selectedDataset: state.selectedDataset?.id === id ? null : state.selectedDataset
        })),
      selectDataset: (dataset) => set({ selectedDataset: dataset }),
      updateDataset: (id, updates) =>
        set((state) => ({
          datasets: state.datasets.map(d => d.id === id ? { ...d, ...updates } : d),
          selectedDataset: state.selectedDataset?.id === id 
            ? { ...state.selectedDataset, ...updates } 
            : state.selectedDataset
        })),
    }),
    {
      name: 'dataguardian-datasets',
    }
  )
);

// Rule Store
export const useRuleStore = create<{
  rules: Rule[];
  selectedRule: Rule | null;
  addRule: (rule: Rule) => void;
  removeRule: (id: string) => void;
  selectRule: (rule: Rule | null) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
}>()(
  persist(
    (set, get) => ({
      rules: [],
      selectedRule: null,
      addRule: (rule) => 
        set((state) => ({ rules: [...state.rules, rule] })),
      removeRule: (id) => 
        set((state) => ({ 
          rules: state.rules.filter(r => r.id !== id),
          selectedRule: state.selectedRule?.id === id ? null : state.selectedRule
        })),
      selectRule: (rule) => set({ selectedRule: rule }),
      updateRule: (id, updates) =>
        set((state) => ({
          rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r),
          selectedRule: state.selectedRule?.id === id 
            ? { ...state.selectedRule, ...updates } 
            : state.selectedRule
        })),
    }),
    {
      name: 'dataguardian-rules',
    }
  )
);

// Stream Store
export const useStreamStore = create<{
  streams: Stream[];
  selectedStream: Stream | null;
  addStream: (stream: Stream) => void;
  removeStream: (id: string) => void;
  selectStream: (stream: Stream | null) => void;
  updateStream: (id: string, updates: Partial<Stream>) => void;
  revokeStream: (id: string) => void;
}>()(
  persist(
    (set, get) => ({
      streams: [],
      selectedStream: null,
      addStream: (stream) => 
        set((state) => ({ streams: [...state.streams, stream] })),
      removeStream: (id) => 
        set((state) => ({ 
          streams: state.streams.filter(s => s.id !== id),
          selectedStream: state.selectedStream?.id === id ? null : state.selectedStream
        })),
      selectStream: (stream) => set({ selectedStream: stream }),
      updateStream: (id, updates) =>
        set((state) => ({
          streams: state.streams.map(s => s.id === id ? { ...s, ...updates } : s),
          selectedStream: state.selectedStream?.id === id 
            ? { ...state.selectedStream, ...updates } 
            : state.selectedStream
        })),
      revokeStream: (id) =>
        set((state) => ({
          streams: state.streams.map(s => 
            s.id === id ? { ...s, status: 'revoked' as const } : s
          ),
          selectedStream: state.selectedStream?.id === id 
            ? { ...state.selectedStream, status: 'revoked' as const } 
            : state.selectedStream
        })),
    }),
    {
      name: 'dataguardian-streams',
    }
  )
);

// Token Store
export const useTokenStore = create<{
  tokens: Token[];
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  revokeToken: (id: string) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
}>()(
  persist(
    (set, get) => ({
      tokens: [],
      addToken: (token) => 
        set((state) => ({ tokens: [...state.tokens, token] })),
      removeToken: (id) => 
        set((state) => ({ tokens: state.tokens.filter(t => t.id !== id) })),
      revokeToken: (id) =>
        set((state) => ({
          tokens: state.tokens.map(t => 
            t.id === id ? { ...t, revoked: true } : t
          )
        })),
      updateToken: (id, updates) =>
        set((state) => ({
          tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
        })),
    }),
    {
      name: 'dataguardian-tokens',
    }
  )
);

// Audit Store
export const useAuditStore = create<{
  events: AuditEvent[];
  addEvent: (event: Omit<AuditEvent, 'id' | 'createdAt'>) => void;
  clearEvents: () => void;
}>()(
  persist(
    (set, get) => ({
      events: [],
      addEvent: (event) => {
        const newEvent: AuditEvent = {
          ...event,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ 
          events: [newEvent, ...state.events].slice(0, 1000) // Keep last 1000 events
        }));
      },
      clearEvents: () => set({ events: [] }),
    }),
    {
      name: 'dataguardian-audit',
    }
  )
);

// Settings Store
export const useSettingsStore = create<{
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}>()(
  persist(
    (set, get) => ({
      settings: {
        language: 'en',
        theme: 'dark',
        demoMode: true,
        notifications: {
          email: true,
          push: false,
          audit: true,
        },
      },
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates }
        })),
    }),
    {
      name: 'dataguardian-settings',
    }
  )
);