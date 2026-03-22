const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://backend-7ej1.onrender.com";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export function getAdminAuthorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
