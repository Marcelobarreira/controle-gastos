const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth");
const formatExpense = require("../utils/formatExpense");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });

    return res.json(expenses.map(formatExpense));
  } catch (error) {
    console.error("Erro ao buscar despesas", error);
    return res.status(500).json({ message: "Erro interno ao listar despesas" });
  }
});

router.post("/", async (req, res) => {
  const { description, amount, category, date, payCycleId } = req.body;

  if (!description || amount === undefined || amount === null) {
    return res.status(400).json({ message: "Descrição e valor são obrigatórios" });
  }

  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount)) {
    return res.status(400).json({ message: "Valor inválido" });
  }

  let parsedDate = new Date();
  if (date) {
    parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Data inválida" });
    }
  }

  try {
    let payCycleToSet = null;
    if (payCycleId !== undefined && payCycleId !== null) {
      const parsedCycle = Number(payCycleId);
      if (Number.isNaN(parsedCycle)) {
        return res.status(400).json({ message: "Ciclo de pagamento inválido" });
      }
      const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
      if (!cycle || cycle.userId !== req.userId) {
        return res.status(404).json({ message: "Ciclo de pagamento não encontrado" });
      }
      payCycleToSet = parsedCycle;
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parsedAmount,
        category: category || null,
        date: parsedDate,
        userId: req.userId,
        payCycleId: payCycleToSet,
      },
    });

    return res.status(201).json(formatExpense(expense));
  } catch (error) {
    console.error("Erro ao criar despesa", error);
    return res.status(500).json({ message: "Erro interno ao criar despesa" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { description, amount, category, date, payCycleId } = req.body;
  const expenseId = Number(id);

  if (Number.isNaN(expenseId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const data = {};

  if (description !== undefined) data.description = description;
  if (category !== undefined) data.category = category || null;
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({ message: "Valor inválido" });
    }
    data.amount = parsedAmount;
  }
  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Data inválida" });
    }
    data.date = parsedDate;
  }

  if (payCycleId !== undefined) {
    if (payCycleId === null || payCycleId === "") {
      data.payCycleId = null;
    } else {
      const parsedCycle = Number(payCycleId);
      if (Number.isNaN(parsedCycle)) {
        return res.status(400).json({ message: "Ciclo de pagamento inválido" });
      }
      const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
      if (!cycle || cycle.userId !== req.userId) {
        return res.status(404).json({ message: "Ciclo de pagamento não encontrado" });
      }
      data.payCycleId = parsedCycle;
    }
  }

  try {
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Despesa não encontrada" });
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data,
    });

    return res.json(formatExpense(updated));
  } catch (error) {
    console.error("Erro ao atualizar despesa", error);
    return res.status(500).json({ message: "Erro interno ao atualizar" });
  }
});

router.delete("/:id", async (req, res) => {
  const expenseId = Number(req.params.id);
  if (Number.isNaN(expenseId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Despesa não encontrada" });
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir despesa", error);
    return res.status(500).json({ message: "Erro interno ao excluir despesa" });
  }
});

module.exports = router;
