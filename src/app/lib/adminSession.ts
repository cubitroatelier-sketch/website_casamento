const ADMIN_AUTH_TOKEN_KEY = "adminAuthToken";

export function getStoredAdminToken() {
  try {
    return window.sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeAdminToken(token: string) {
  try {
    window.sessionStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
  } catch {
    // Safari/WebKit can block sessionStorage in private/restricted modes.
  }
}

export function clearStoredAdminToken() {
  try {
    window.sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage cleanup failures; local state still logs the user out.
  }
}
