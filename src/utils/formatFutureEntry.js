function formatFutureEntry(entry) {
  const amount =
    entry.amount && typeof entry.amount.toNumber === "function" ? entry.amount.toNumber() : Number(entry.amount);

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

module.exports = formatFutureEntry;
