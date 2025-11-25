function formatExpense(expense) {
  const amount =
    expense.amount && typeof expense.amount.toNumber === "function"
      ? expense.amount.toNumber()
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

module.exports = formatExpense;
