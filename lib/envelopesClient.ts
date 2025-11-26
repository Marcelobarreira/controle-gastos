import type { SpendingEnvelope } from "@prisma/client";
import { request } from "./clientApiBase";
import type { EnvelopeDTO } from "./typesEnvelope";

export function fetchEnvelopes(token: string, payCycleId?: string): Promise<EnvelopeDTO[]> {
  const query = payCycleId ? `?payCycleId=${payCycleId}` : "";
  return request<EnvelopeDTO[]>(`/envelopes${query}`, { method: "GET" }, token);
}

export function createEnvelope(token: string, payload: { title: string; budget: number }): Promise<EnvelopeDTO> {
  return request<EnvelopeDTO>("/envelopes", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function updateEnvelope(
  token: string,
  id: number,
  payload: Partial<{ title: string; budget: number }>
): Promise<EnvelopeDTO> {
  return request<EnvelopeDTO>(`/envelopes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
}

export function deleteEnvelope(token: string, id: number): Promise<void> {
  return request<void>(`/envelopes/${id}`, { method: "DELETE" }, token);
}

export function deleteAllocation(token: string, envelopeId: number, allocationId: number): Promise<EnvelopeDTO> {
  return request<EnvelopeDTO>(`/envelopes/${envelopeId}/allocations/${allocationId}`, { method: "DELETE" }, token);
}

export function fetchEnvelope(token: string, id: number): Promise<EnvelopeDTO> {
  return request<EnvelopeDTO>(`/envelopes/${id}`, { method: "GET" }, token);
}

export function addAllocation(
  token: string,
  envelopeId: number,
  payload: { title: string; amount: number; date?: string }
): Promise<EnvelopeDTO> {
  return request<EnvelopeDTO>(`/envelopes/${envelopeId}/allocations`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}
