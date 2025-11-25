import { SpendingAllocation, SpendingEnvelope } from "@prisma/client";

export function formatEnvelope(envelope: SpendingEnvelope & { allocations?: SpendingAllocation[] }) {
  const budget =
    // @ts-ignore
    envelope.budget && typeof (envelope.budget as any).toNumber === "function"
      ? // @ts-ignore
        (envelope.budget as any).toNumber()
      : Number(envelope.budget);

  const allocations = envelope.allocations
    ? envelope.allocations.map((alloc) => ({
        id: alloc.id,
        envelopeId: alloc.envelopeId,
        title: alloc.title,
        amount:
          // @ts-ignore
          alloc.amount && typeof (alloc.amount as any).toNumber === "function"
            ? // @ts-ignore
              (alloc.amount as any).toNumber()
            : Number(alloc.amount),
        date: alloc.date,
        createdAt: alloc.createdAt,
        updatedAt: alloc.updatedAt,
      }))
    : undefined;

  return {
    id: envelope.id,
    title: envelope.title,
    budget,
    userId: envelope.userId,
    createdAt: envelope.createdAt,
    updatedAt: envelope.updatedAt,
    allocations,
  };
}
