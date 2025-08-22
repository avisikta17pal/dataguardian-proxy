export type Role = "citizen" | "app" | "admin";

export interface Dataset {
  id: string;
  name: string;
  rows: number;
  schema: Column[];
  sha256: string;
  createdAt: string;
  size?: number;
  source?: string;
}

export interface Column {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  pii?: boolean;
  nullable?: boolean;
  unique?: boolean;
}

export interface Rule {
  id: string;
  name: string;
  datasetId: string;
  fields: string[];
  filters: Filter[];
  aggregations?: Aggregation[];
  obfuscation?: Obfuscation;
  ttlMinutes: number;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface Filter {
  field: string;
  op: "equals" | "contains" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "rangeDate";
  value: any;
  value2?: any;
}

export interface Aggregation {
  field: string;
  op: "sum" | "avg" | "min" | "max" | "count" | "groupByDay" | "groupByMonth";
  alias?: string;
}

export interface Obfuscation {
  jitter?: number;
  rounding?: number;
  bucket?: number;
  kAnonymity?: number;
  dropPII?: boolean;
  noiseLevel?: "low" | "medium" | "high";
}

export interface Stream {
  id: string;
  ruleId: string;
  name: string;
  status: "active" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
  accessCount?: number;
  lastAccessed?: string;
  datasetName?: string;
  ruleName?: string;
}

export interface Token {
  id: string;
  streamId: string;
  token: string;
  scope: string[];
  expiresAt: string;
  oneTime: boolean;
  createdAt: string;
  revoked?: boolean;
  name?: string;
  accessCount?: number;
  lastUsed?: string;
}

export interface AuditEvent {
  id: string;
  type: "dataset_created" | "dataset_deleted" | "rule_created" | "rule_updated" | "stream_created" | "stream_accessed" | "stream_revoked" | "token_created" | "token_revoked" | "token_used";
  actor: Role;
  message: string;
  createdAt: string;
  meta?: Record<string, any>;
  severity?: "info" | "warning" | "error";
}

export interface AppSettings {
  language: "en" | "hi" | "bn";
  theme: "light" | "dark" | "system";
  demoMode: boolean;
  apiBaseUrl?: string;
  notifications: {
    email: boolean;
    push: boolean;
    audit: boolean;
  };
}

export interface ConsentReceipt {
  id: string;
  datasetId: string;
  streamId: string;
  purpose: string;
  dataShared: string[];
  expiryDate: string;
  revokedAt?: string;
  generatedAt: string;
  datasetHash: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: any[][];
  schema: Column[];
  stats: {
    totalRows: number;
    nullCounts: Record<string, number>;
    uniqueCounts: Record<string, number>;
    dataTypes: Record<string, string>;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Store interfaces for Zustand
export interface DatasetStore {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  selectDataset: (dataset: Dataset | null) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
}

export interface RuleStore {
  rules: Rule[];
  selectedRule: Rule | null;
  addRule: (rule: Rule) => void;
  removeRule: (id: string) => void;
  selectRule: (rule: Rule | null) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
}

export interface StreamStore {
  streams: Stream[];
  selectedStream: Stream | null;
  addStream: (stream: Stream) => void;
  removeStream: (id: string) => void;
  selectStream: (stream: Stream | null) => void;
  updateStream: (id: string, updates: Partial<Stream>) => void;
  revokeStream: (id: string) => void;
}

export interface TokenStore {
  tokens: Token[];
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  revokeToken: (id: string) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
}

export interface AuditStore {
  events: AuditEvent[];
  addEvent: (event: Omit<AuditEvent, 'id' | 'createdAt'>) => void;
  clearEvents: () => void;
}

export interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}