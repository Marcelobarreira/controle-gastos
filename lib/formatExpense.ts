import { Expense } from "@prisma/client";

export function formatExpense(expense: Expense) {
  const amount =
    // @ts-ignore
    expense.amount && typeof (expense.amount as any).toNumber === "function"
      ? // @ts-ignore
        (expense.amount as any).toNumber()
      : Number(expense.amount);

  return {
    id: expense.id,
    description: expense.description,
    amount,
    category: expense.category,
    date: expense.date,
    userId: expense.userId,
    payCycleId: expense.payCycleId ?? null,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
