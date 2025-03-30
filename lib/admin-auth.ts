export function getAdminAuthHeaders(): Record<string, string> {
  const credentials = localStorage.getItem("adminAuth");
  if (!credentials) {
    return {};
  }
  return {
    Authorization: `Basic ${credentials}`,
  };
}

export function isAdminAuthenticated(): boolean {
  return !!localStorage.getItem("adminAuth");
}

export function logoutAdmin(): void {
  localStorage.removeItem("adminAuth");
} 