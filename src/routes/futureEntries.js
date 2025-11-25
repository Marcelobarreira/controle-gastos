const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth");
const formatFutureEntry = require("../utils/formatFutureEntry");

const router = express.Router();

router.use(authMiddleware);

const VALID_TYPES = ["expense", "income"];

router.get("/", async (req, res) => {
  try {
    const items = await prisma.futureEntry.findMany({
      where: { userId: req.userId },
      orderBy: { dueDate: "asc" },
    });
    return res.json(items.map(formatFutureEntry));
  } catch (error) {
    console.error("Erro ao listar lancamentos futuros", error);
    return res.status(500).json({ message: "Erro interno ao listar lançamentos futuros" });
  }
});

router.post("/", async (req, res) => {
  const { title, amount, category, dueDate, type } = req.body;

  if (!title || amount === undefined || amount === null || !dueDate) {
    return res.status(400).json({ message: "Título, valor e data são obrigatórios" });
  }

  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount)) {
    return res.status(400).json({ message: "Valor inválido" });
  }

  const parsedDate = new Date(dueDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "Data inválida" });
  }

  const typeToUse = type && VALID_TYPES.includes(type) ? type : "expense";

  try {
    const created = await prisma.futureEntry.create({
      data: {
        title,
        amount: parsedAmount,
        category: category || null,
        dueDate: parsedDate,
        type: typeToUse,
        userId: req.userId,
      },
    });
    return res.status(201).json(formatFutureEntry(created));
  } catch (error) {
    console.error("Erro ao criar lançamento futuro", error);
    return res.status(500).json({ message: "Erro interno ao criar lançamento futuro" });
  }
});

router.put("/:id", async (req, res) => {
  const entryId = Number(req.params.id);
  if (Number.isNaN(entryId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const data = {};
  const { title, amount, category, dueDate, type } = req.body;

  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category || null;
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({ message: "Valor inválido" });
    }
    data.amount = parsedAmount;
  }
  if (dueDate !== undefined) {
    const parsedDate = new Date(dueDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Data inválida" });
    }
    data.dueDate = parsedDate;
  }
  if (type !== undefined) {
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: "Tipo inválido" });
    }
    data.type = type;
  }

  try {
    const existing = await prisma.futureEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Lançamento futuro não encontrado" });
    }

    const updated = await prisma.futureEntry.update({ where: { id: entryId }, data });
    return res.json(formatFutureEntry(updated));
  } catch (error) {
    console.error("Erro ao atualizar lançamento futuro", error);
    return res.status(500).json({ message: "Erro interno ao atualizar lançamento futuro" });
  }
});

router.delete("/:id", async (req, res) => {
  const entryId = Number(req.params.id);
  if (Number.isNaN(entryId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const existing = await prisma.futureEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Lançamento futuro não encontrado" });
    }

    await prisma.futureEntry.delete({ where: { id: entryId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir lançamento futuro", error);
    return res.status(500).json({ message: "Erro interno ao excluir lançamento futuro" });
  }
});

module.exports = router;
