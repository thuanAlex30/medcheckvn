import type {
  SearchResponse,
  InteractionCheckResponse,
  PriceComparisonResponse,
  OcrResponse,
  AuthResponse,
  MedicationScheduleEntry,
  AlternativeDrug,
} from '@medcheck/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message ?? res.statusText, err);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { email: string; password: string; name?: string }) =>
    apiFetch<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  refresh: () =>
    apiFetch<{ accessToken: string }>('/api/v1/auth/refresh', { method: 'POST' }),

  logout: () =>
    apiFetch<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' }),
};

// ── Drugs ─────────────────────────────────────────────────────────────────────

export const drugsApi = {
  search: (q: string, limit = 10) =>
    apiFetch<SearchResponse>(`/api/v1/drugs/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getBySlug: (slug: string) =>
    apiFetch<unknown>(`/api/v1/drugs/${encodeURIComponent(slug)}`),

  getAlternatives: (id: string) =>
    apiFetch<{ alternatives: unknown[] }>(`/api/v1/drugs/${id}/alternatives`),

  getPrices: (id: string) =>
    apiFetch<PriceComparisonResponse>(`/api/v1/drugs/${id}/prices`),

  getAlternativesWithPrices: (id: string) =>
    apiFetch<{ alternatives: AlternativeDrug[] }>(`/api/v1/drugs/${id}/alternatives`),
};

// ── Interactions ─────────────────────────────────────────────────────────────

export const interactionsApi = {
  check: (drugIds: string[]) =>
    apiFetch<InteractionCheckResponse>('/api/v1/interactions/check', {
      method: 'POST',
      body: JSON.stringify({ drugIds }),
    }),
};

// ── User / Schedule ───────────────────────────────────────────────────────────

export const userApi = {
  me: () => apiFetch<unknown>('/api/v1/users/me'),

  consent: () =>
    apiFetch<{ ok: boolean }>('/api/v1/users/me/consent', { method: 'POST' }),

  getConditions: () =>
    apiFetch<{ conditions: string[] }>('/api/v1/users/me/conditions'),

  updateConditions: (conditions: string[]) =>
    apiFetch<{ ok: boolean }>('/api/v1/users/me/conditions', {
      method: 'PATCH',
      body: JSON.stringify({ conditions }),
    }),

  getSchedule: () =>
    apiFetch<{ schedule: MedicationScheduleEntry[] }>('/api/v1/users/me/schedule'),

  addToSchedule: (entry: Omit<MedicationScheduleEntry, 'id'>) =>
    apiFetch<MedicationScheduleEntry>('/api/v1/users/me/schedule', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  removeFromSchedule: (entryId: string) =>
    apiFetch<{ ok: boolean }>(`/api/v1/users/me/schedule/${entryId}`, { method: 'DELETE' }),
};

// ── OCR ───────────────────────────────────────────────────────────────────────

export const ocrApi = {
  uploadPrescription: async (file: File): Promise<OcrResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/api/v1/ocr/prescription`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, err.message ?? res.statusText, err);
    }

    return res.json() as Promise<OcrResponse>;
  },
};
