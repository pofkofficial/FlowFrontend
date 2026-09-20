// In services/api.ts

export interface ApiFetchOptions extends RequestInit {
  rawResponse?: boolean;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { rawResponse, headers, ...customConfig } = options;
  const token = localStorage.getItem('token'); // or your token getter
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
    },
    ...customConfig,
  };

  const response = await fetch(`${BACKEND_URL}/v1${endpoint}`, config);

  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }

  // Return the raw Response object if requested
  if (rawResponse) {
    return response as unknown as T;
  }

  return response.json();
}