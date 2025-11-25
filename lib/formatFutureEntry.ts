import { FutureEntry } from "@prisma/client";

export function formatFutureEntry(entry: FutureEntry) {
  const amount =
    // @ts-ignore
    entry.amount && typeof (entry.amount as any).toNumber === "function"
      ? // @ts-ignore
        (entry.amount as any).toNumber()
      : Number(entry.amount);

  return {
    id: entry.id,
    title: entry.title,
    amount,
    category: entry.category,
    dueDate: entry.dueDate,
    type: entry.type,
    userId: entry.userId,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
