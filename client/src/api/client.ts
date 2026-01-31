import type { Version, SaveTextRequest, ListVersionsResponse } from '../types/api';

// 生产环境使用相对路径（通过Caddy统一访问），开发环境使用环境变量或默认值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8080/api/v1');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 保存文本（创建新版本）
  async saveText(content: string, name: string): Promise<Version> {
    const request: SaveTextRequest = { content, name };
    return this.request<Version>('/save', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 根据 name 获取版本列表
  async listVersions(name: string, limit: number = 50, offset: number = 0): Promise<ListVersionsResponse> {
    const params = new URLSearchParams({ name, limit: String(limit), offset: String(offset) });
    return this.request<ListVersionsResponse>(`/versions?${params}`);
  }

  // 根据ID获取版本
  async getVersion(id: number): Promise<Version> {
    return this.request<Version>(`/version/${id}`);
  }

  // 根据 name 获取最新版本
  async getLatest(name: string): Promise<Version> {
    return this.request<Version>(`/latest?name=${encodeURIComponent(name)}`);
  }

  // 获取所有不重复的 name 列表
  async listNames(): Promise<string[]> {
    const data = await this.request<{ names: string[] }>('/names');
    return data.names ?? [];
  }
}

export const apiClient = new ApiClient();
