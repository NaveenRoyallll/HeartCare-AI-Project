const API_BASE = process.env.EXPO_PUBLIC_API_URL || (__DEV__
  ? 'http://10.0.2.2:8000/api/v1'
  : 'http://localhost:8000/api/v1');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    return this.post('/auth/refresh', { refresh_token: refreshToken });
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Request failed` }));
        throw new ApiError(res.status, error.detail || error.message || 'Request failed');
      }

      if (res.status === 204) {
        return null as unknown as T;
      }

      return await res.json();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Network connection error';
      throw new ApiError(0, message);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  getDashboard<T>(): Promise<T> {
    return this.get<T>('/health/dashboard');
  }

  listVitals<T>(): Promise<T> {
    return this.get<T>('/vitals/?limit=100');
  }
}

export const api = new ApiClient();
