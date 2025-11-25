const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && (data as any).message) || "Erro inesperado";
    throw new Error(message as string);
  }

  return data as T;
}
