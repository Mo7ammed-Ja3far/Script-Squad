// ============================================================
// ClinicFlow — Axios API Configuration
// Handles: cookies + Bearer token, response unwrapping,
// error normalization, 401 redirect
// ============================================================

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "../types";

// ─── Base URL ─────────────────────────────────────────────────

export const BASE_URL = "https://f56f-162-55-178-223.ngrok-free.app";
console.log(`API Base URL: ${BASE_URL}`);
export const API_URL = `${BASE_URL}/api`;

// ─── Axios Instance ───────────────────────────────────────────

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Always send HttpOnly cookie
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 15_000,
});

// ─── Token Store (for Bearer token fallback) ─────────────────
// The server sets an HttpOnly cookie on login; this is only
// needed when the cookie is unavailable (e.g. native mobile app).

let _bearerToken: string | null = null;

export const tokenStore = {
  set: (token: string) => {
    _bearerToken = token;
    localStorage.setItem("cf_token", token);
  },
  get: (): string | null => {
    if (_bearerToken) return _bearerToken;
    return localStorage.getItem("cf_token");
  },
  clear: () => {
    _bearerToken = null;
    localStorage.removeItem("cf_token");
  },
};

// ─── Request Interceptor ──────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Session expired — clear local token and redirect to login
      tokenStore.clear();
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/auth")) {
        window.location.href = `/auth/login?expired=true`;
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

// ─── Error Normalization ──────────────────────────────────────

export interface NormalizedError {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
}

function normalizeError(error: AxiosError<ApiError>): NormalizedError {
  if (error.response) {
    const { data, status } = error.response;
    const fieldErrors =
      data?.errors?.reduce(
        (acc, e) => ({ ...acc, [e.field]: e.message }),
        {} as Record<string, string>,
      ) ?? undefined;

    return {
      message: data?.message ?? "Something went wrong.",
      status,
      fieldErrors,
    };
  }

  if (error.request) {
    return {
      message: "Unable to reach the server. Please check your connection.",
    };
  }

  return {
    message: error.message ?? "An unexpected error occurred.",
  };
}

// ─── Typed API helpers ────────────────────────────────────────
// Unwrap the `data` field from the success envelope automatically.

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<{ success: true; data: T; meta?: unknown }>(url, {
    params,
  });
  return res.data;
}

export async function apiPost<T, P = unknown>(url: string, payload?: P) {
  const res = await api.post<{ success: true; data: T; message: string }>(
    url,
    payload,
  );
  return res.data;
}

export async function apiPatch<T, P = unknown>(url: string, payload?: P) {
  const res = await api.patch<{ success: true; data: T; message: string }>(
    url,
    payload,
  );
  return res.data;
}

export async function apiDelete<T = void>(url: string) {
  const res = await api.delete<{ success: true; data: T; message: string }>(
    url,
  );
  return res.data;
}
