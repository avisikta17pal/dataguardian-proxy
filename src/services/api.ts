import { Dataset, Rule, Stream, Token, AuditEvent, ParsedCSV, ApiResponse } from '@/types';
import Papa from 'papaparse';
import { useSettingsStore } from '@/stores';

// Mock delay for realistic API simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate SHA-256 hash from string
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// CSV Parser
export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message));
          return;
        }

        const headers = results.meta.fields || [];
        const rows = results.data as any[];
        
        // Infer schema
        const schema = headers.map(header => {
          const samples = rows.slice(0, 100).map(row => row[header]).filter(val => val != null);
          
          let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
          
          if (samples.length > 0) {
            // Check if it's a number
            if (samples.every(val => typeof val === 'number' && !isNaN(val))) {
              type = 'number';
            }
            // Check if it's a date
            else if (samples.some(val => {
              const date = new Date(val);
              return !isNaN(date.getTime()) && typeof val === 'string' && val.includes('-');
            })) {
              type = 'date';
            }
            // Check if it's boolean
            else if (samples.every(val => typeof val === 'boolean' || val === 'true' || val === 'false')) {
              type = 'boolean';
            }
          }

          // Detect PII fields
          const lowerHeader = header.toLowerCase();
          const isPII = lowerHeader.includes('name') || 
                        lowerHeader.includes('email') || 
                        lowerHeader.includes('phone') ||
                        lowerHeader.includes('ssn') ||
                        lowerHeader.includes('address');

          return {
            name: header,
            type,
            pii: isPII,
            nullable: samples.length < rows.length,
            unique: new Set(samples).size === samples.length
          };
        });

        // Calculate stats
        const stats = {
          totalRows: rows.length,
          nullCounts: {} as Record<string, number>,
          uniqueCounts: {} as Record<string, number>,
          dataTypes: {} as Record<string, string>
        };

        headers.forEach(header => {
          const values = rows.map(row => row[header]);
          stats.nullCounts[header] = values.filter(val => val == null).length;
          stats.uniqueCounts[header] = new Set(values.filter(val => val != null)).size;
          stats.dataTypes[header] = schema.find(s => s.name === header)?.type || 'string';
        });

        resolve({
          headers,
          rows: rows.map(row => headers.map(header => row[header])),
          schema,
          stats
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Load mock data from JSON files
async function loadMockData<T>(filename: string): Promise<T[]> {
  try {
    const response = await fetch(`/mock/${filename}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Check if we're in demo mode
function isDemoMode(): boolean {
  const settings = useSettingsStore.getState().settings;
  return settings.demoMode || !settings.apiBaseUrl;
}

// Mock API implementation
class MockAPI {
  private getFromStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getDatasets(): Promise<ApiResponse<Dataset[]>> {
    await delay(300);
    let datasets = this.getFromStorage<Dataset>('dataguardian-datasets');
    
    // Pre-populate with sample data if empty
    if (datasets.length === 0) {
      const sampleDatasets = await loadMockData<Dataset>('sample-datasets.json');
      datasets = sampleDatasets;
      this.saveToStorage('dataguardian-datasets', datasets);
    }
    
    return {
      data: datasets,
      timestamp: new Date().toISOString()
    };
  }

  async createDataset(dataset: Omit<Dataset, 'id' | 'createdAt'>): Promise<ApiResponse<Dataset>> {
    await delay(500);
    const newDataset: Dataset = {
      ...dataset,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const datasets = this.getFromStorage<Dataset>('dataguardian-datasets');
    datasets.push(newDataset);
    this.saveToStorage('dataguardian-datasets', datasets);
    
    return {
      data: newDataset,
      message: 'Dataset created successfully',
      timestamp: new Date().toISOString()
    };
  }

  async deleteDataset(id: string): Promise<ApiResponse<void>> {
    await delay(200);
    const datasets = this.getFromStorage<Dataset>('dataguardian-datasets');
    const filtered = datasets.filter(d => d.id !== id);
    this.saveToStorage('dataguardian-datasets', filtered);
    
    return {
      data: undefined,
      message: 'Dataset deleted successfully',
      timestamp: new Date().toISOString()
    };
  }

  async getRules(): Promise<ApiResponse<Rule[]>> {
    await delay(300);
    let rules = this.getFromStorage<Rule>('dataguardian-rules');
    
    // Pre-populate with sample data if empty
    if (rules.length === 0) {
      const sampleRules = await loadMockData<Rule>('sample-rules.json');
      rules = sampleRules;
      this.saveToStorage('dataguardian-rules', rules);
    }
    
    return {
      data: rules,
      timestamp: new Date().toISOString()
    };
  }

  async createRule(rule: Omit<Rule, 'id' | 'createdAt'>): Promise<ApiResponse<Rule>> {
    await delay(500);
    const newRule: Rule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const rules = this.getFromStorage<Rule>('dataguardian-rules');
    rules.push(newRule);
    this.saveToStorage('dataguardian-rules', rules);
    
    return {
      data: newRule,
      message: 'Rule created successfully',
      timestamp: new Date().toISOString()
    };
  }

  async getStreams(): Promise<ApiResponse<Stream[]>> {
    await delay(300);
    let streams = this.getFromStorage<Stream>('dataguardian-streams');
    
    // Pre-populate with sample data if empty
    if (streams.length === 0) {
      const sampleStreams = await loadMockData<Stream>('sample-streams.json');
      streams = sampleStreams;
      this.saveToStorage('dataguardian-streams', streams);
    }
    
    return {
      data: streams,
      timestamp: new Date().toISOString()
    };
  }

  async createStream(stream: Omit<Stream, 'id' | 'createdAt'>): Promise<ApiResponse<Stream>> {
    await delay(500);
    const newStream: Stream = {
      ...stream,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const streams = this.getFromStorage<Stream>('dataguardian-streams');
    streams.push(newStream);
    this.saveToStorage('dataguardian-streams', streams);
    
    return {
      data: newStream,
      message: 'Stream created successfully',
      timestamp: new Date().toISOString()
    };
  }

  async getStreamData(id: string, token?: string): Promise<ApiResponse<any[]>> {
    await delay(400);
    // Return mock filtered data
    const mockData = [
      { timestamp: '2024-01-01', value: 100, category: 'A' },
      { timestamp: '2024-01-02', value: 150, category: 'B' },
      { timestamp: '2024-01-03', value: 120, category: 'A' },
    ];
    
    return {
      data: mockData,
      timestamp: new Date().toISOString()
    };
  }

  async revokeStream(id: string): Promise<ApiResponse<void>> {
    await delay(300);
    const streams = this.getFromStorage<Stream>('dataguardian-streams');
    const updated = streams.map(s => 
      s.id === id ? { ...s, status: 'revoked' as const } : s
    );
    this.saveToStorage('dataguardian-streams', updated);
    
    return {
      data: undefined,
      message: 'Stream revoked successfully',
      timestamp: new Date().toISOString()
    };
  }

  async getTokens(): Promise<ApiResponse<Token[]>> {
    await delay(300);
    let tokens = this.getFromStorage<Token>('dataguardian-tokens');
    
    // Pre-populate with sample data if empty
    if (tokens.length === 0) {
      const sampleTokens = await loadMockData<Token>('sample-tokens.json');
      tokens = sampleTokens;
      this.saveToStorage('dataguardian-tokens', tokens);
    }
    
    return {
      data: tokens,
      timestamp: new Date().toISOString()
    };
  }

  async createToken(token: Omit<Token, 'id' | 'createdAt'>): Promise<ApiResponse<Token>> {
    await delay(400);
    const newToken: Token = {
      ...token,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const tokens = this.getFromStorage<Token>('dataguardian-tokens');
    tokens.push(newToken);
    this.saveToStorage('dataguardian-tokens', tokens);
    
    return {
      data: newToken,
      message: 'Token created successfully',
      timestamp: new Date().toISOString()
    };
  }

  async revokeToken(id: string): Promise<ApiResponse<void>> {
    await delay(300);
    const tokens = this.getFromStorage<Token>('dataguardian-tokens');
    const updated = tokens.map(t => 
      t.id === id ? { ...t, revoked: true } : t
    );
    this.saveToStorage('dataguardian-tokens', updated);
    
    return {
      data: undefined,
      message: 'Token revoked successfully',
      timestamp: new Date().toISOString()
    };
  }

  async getAuditEvents(): Promise<ApiResponse<AuditEvent[]>> {
    await delay(300);
    let events = this.getFromStorage<AuditEvent>('dataguardian-audit');
    
    // Pre-populate with sample data if empty
    if (events.length === 0) {
      const sampleEvents = await loadMockData<AuditEvent>('sample-audit.json');
      events = sampleEvents;
      this.saveToStorage('dataguardian-audit', events);
    }
    
    return {
      data: events,
      timestamp: new Date().toISOString()
    };
  }
}

// Real API implementation (for future use)
class RealAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getDatasets(): Promise<ApiResponse<Dataset[]>> {
    return this.request<Dataset[]>('/datasets');
  }

  async createDataset(dataset: Omit<Dataset, 'id' | 'createdAt'>): Promise<ApiResponse<Dataset>> {
    return this.request<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(dataset),
    });
  }

  async deleteDataset(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/datasets/${id}`, {
      method: 'DELETE',
    });
  }

  async getRules(): Promise<ApiResponse<Rule[]>> {
    return this.request<Rule[]>('/rules');
  }

  async createRule(rule: Omit<Rule, 'id' | 'createdAt'>): Promise<ApiResponse<Rule>> {
    return this.request<Rule>('/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async getStreams(): Promise<ApiResponse<Stream[]>> {
    return this.request<Stream[]>('/streams');
  }

  async createStream(stream: Omit<Stream, 'id' | 'createdAt'>): Promise<ApiResponse<Stream>> {
    return this.request<Stream>('/streams', {
      method: 'POST',
      body: JSON.stringify(stream),
    });
  }

  async getStreamData(id: string, token?: string): Promise<ApiResponse<any[]>> {
    const params = token ? `?token=${token}` : '';
    return this.request<any[]>(`/streams/${id}/data${params}`);
  }

  async revokeStream(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/streams/${id}/revoke`, {
      method: 'POST',
    });
  }

  async getTokens(): Promise<ApiResponse<Token[]>> {
    return this.request<Token[]>('/tokens');
  }

  async createToken(token: Omit<Token, 'id' | 'createdAt'>): Promise<ApiResponse<Token>> {
    return this.request<Token>('/tokens', {
      method: 'POST',
      body: JSON.stringify(token),
    });
  }

  async revokeToken(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tokens/${id}/revoke`, {
      method: 'POST',
    });
  }

  async getAuditEvents(): Promise<ApiResponse<AuditEvent[]>> {
    return this.request<AuditEvent[]>('/audit');
  }
}

// API instance factory
function createAPI() {
  if (isDemoMode()) {
    return new MockAPI();
  } else {
    const settings = useSettingsStore.getState().settings;
    return new RealAPI(settings.apiBaseUrl!);
  }
}

// Export API instance
export const api = createAPI();

// Export types and utilities
export type { ApiResponse };
export { MockAPI, RealAPI };