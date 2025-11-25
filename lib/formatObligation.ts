import { Obligation } from "@prisma/client";

export function formatObligation(obligation: Obligation) {
  const amount =
    // @ts-ignore
    obligation.amount && typeof (obligation.amount as any).toNumber === "function"
      ? // @ts-ignore
        (obligation.amount as any).toNumber()
      : Number(obligation.amount);

  return {
    id: obligation.id,
    title: obligation.title,
    amount,
    category: obligation.category,
    dueDay: obligation.dueDay,
    userId: obligation.userId,
    payCycleId: obligation.payCycleId ?? null,
    createdAt: obligation.createdAt,
    updatedAt: obligation.updatedAt,
  };
}
