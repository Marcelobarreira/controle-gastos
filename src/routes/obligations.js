const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

function formatDecimal(value) {
  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value);
}

router.get("/", async (req, res) => {
  try {
    const obligations = await prisma.obligation.findMany({
      where: { userId: req.userId },
      orderBy: [{ dueDay: "asc" }, { createdAt: "desc" }],
    });

    return res.json(
      obligations.map((ob) => ({
        ...ob,
        amount: formatDecimal(ob.amount),
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar obrigações", error);
    return res.status(500).json({ message: "Erro interno ao listar obrigações" });
  }
});

router.post("/", async (req, res) => {
  const { title, amount, category, dueDay, payCycleId } = req.body;

  if (!title || amount === undefined || dueDay === undefined) {
    return res.status(400).json({ message: "Título, valor e dia de vencimento são obrigatórios" });
  }

  const parsedAmount = parseFloat(amount);
  const parsedDay = parseInt(dueDay, 10);
  if (Number.isNaN(parsedAmount) || Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
    return res.status(400).json({ message: "Valor ou dia inválidos" });
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

    const obligation = await prisma.obligation.create({
      data: {
        title,
        amount: parsedAmount,
        category: category || null,
        dueDay: parsedDay,
        userId: req.userId,
        payCycleId: payCycleToSet,
      },
    });

    return res.status(201).json({ ...obligation, amount: formatDecimal(obligation.amount) });
  } catch (error) {
    console.error("Erro ao criar obrigação", error);
    return res.status(500).json({ message: "Erro interno ao criar obrigação" });
  }
});

router.put("/:id", async (req, res) => {
  const obligationId = Number(req.params.id);
  if (Number.isNaN(obligationId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const { title, amount, category, dueDay, payCycleId } = req.body;
  const data = {};

  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category || null;
  if (amount !== undefined) {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed)) {
      return res.status(400).json({ message: "Valor inválido" });
    }
    data.amount = parsed;
  }
  if (dueDay !== undefined) {
    const parsed = parseInt(dueDay, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 31) {
      return res.status(400).json({ message: "Dia inválido" });
    }
    data.dueDay = parsed;
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
    const existing = await prisma.obligation.findUnique({ where: { id: obligationId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Obrigação não encontrada" });
    }

    const updated = await prisma.obligation.update({
      where: { id: obligationId },
      data,
    });

    return res.json({ ...updated, amount: formatDecimal(updated.amount) });
  } catch (error) {
    console.error("Erro ao atualizar obrigação", error);
    return res.status(500).json({ message: "Erro interno ao atualizar obrigação" });
  }
});

router.delete("/:id", async (req, res) => {
  const obligationId = Number(req.params.id);
  if (Number.isNaN(obligationId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const existing = await prisma.obligation.findUnique({ where: { id: obligationId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Obrigação não encontrada" });
    }

    await prisma.obligation.delete({ where: { id: obligationId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir obrigação", error);
    return res.status(500).json({ message: "Erro interno ao excluir obrigação" });
  }
});

module.exports = router;
