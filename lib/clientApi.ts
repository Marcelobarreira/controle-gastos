import type { Expense, FutureEntry, Obligation, PayCycle, User } from "./types";
import { request } from "./clientApiBase";

type AuthPayload = { name?: string; email: string; password: string };
type AuthResponse = { token: string; user: User };

export function login(payload: AuthPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function register(payload: AuthPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchExpenses(token: string): Promise<Expense[]> {
  return request<Expense[]>("/expenses", { method: "GET" }, token);
}

export function createExpense(
  token: string,
  payload: { description: string; amount: number; category?: string; date?: string; payCycleId?: number | null }
): Promise<Expense> {
  return request<Expense>("/expenses", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function updateExpense(
  token: string,
  id: number,
  payload: { description?: string; amount?: number; category?: string; date?: string; payCycleId?: number | null }
): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export function deleteExpense(token: string, id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: "DELETE" }, token);
}

export function fetchObligations(token: string): Promise<Obligation[]> {
  return request<Obligation[]>("/obligations", { method: "GET" }, token);
}

export function createObligation(
  token: string,
  payload: { title: string; amount: number; category?: string; dueDay: number; payCycleId?: number | null }
): Promise<Obligation> {
  return request<Obligation>("/obligations", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function updateObligation(
  token: string,
  id: number,
  payload: { title?: string; amount?: number; category?: string; dueDay?: number; payCycleId?: number | null }
): Promise<Obligation> {
  return request<Obligation>(`/obligations/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export function deleteObligation(token: string, id: number): Promise<void> {
  return request<void>(`/obligations/${id}`, { method: "DELETE" }, token);
}

export function fetchProfile(token: string): Promise<User> {
  return request<User>("/profile/me", { method: "GET" }, token);
}

export function updateSalary(token: string, salary: number): Promise<User> {
  return request<User>("/profile/salary", { method: "PUT", body: JSON.stringify({ salary }) }, token);
}

export function fetchPayCycles(token: string): Promise<PayCycle[]> {
  return request<PayCycle[]>("/pay-cycles", { method: "GET" }, token);
}

export function createPayCycle(token: string, payload: { name: string; payDay: number }): Promise<PayCycle> {
  return request<PayCycle>("/pay-cycles", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function deletePayCycle(token: string, id: number): Promise<void> {
  return request<void>(`/pay-cycles/${id}`, { method: "DELETE" }, token);
}

export function updatePayCycle(
  token: string,
  id: number,
  payload: { name?: string; payDay?: number; salaryAmount?: number | null }
): Promise<PayCycle> {
  return request<PayCycle>(`/pay-cycles/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export function fetchFutureEntries(token: string): Promise<FutureEntry[]> {
  return request<FutureEntry[]>("/future-entries", { method: "GET" }, token);
}

export function createFutureEntry(
  token: string,
  payload: { title: string; amount: number; category?: string; dueDate: string; type: "expense" | "income" }
): Promise<FutureEntry> {
  return request<FutureEntry>("/future-entries", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function updateFutureEntry(
  token: string,
  id: number,
  payload: Partial<{ title: string; amount: number; category?: string; dueDate: string; type: "expense" | "income" }>
): Promise<FutureEntry> {
  return request<FutureEntry>(`/future-entries/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export function deleteFutureEntry(token: string, id: number): Promise<void> {
  return request<void>(`/future-entries/${id}`, { method: "DELETE" }, token);
}
