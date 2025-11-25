const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const payCycles = await prisma.payCycle.findMany({
      where: { userId: req.userId },
      orderBy: { payDay: "asc" },
    });
    return res.json(payCycles);
  } catch (error) {
    console.error("Erro ao buscar ciclos de pagamento", error);
    return res.status(500).json({ message: "Erro ao listar ciclos" });
  }
});

router.post("/", async (req, res) => {
  const { name, payDay } = req.body;
  const day = parseInt(payDay, 10);
  if (!name || Number.isNaN(day) || day < 1 || day > 31) {
    return res.status(400).json({ message: "Nome e dia (1-31) são obrigatórios" });
  }

  try {
    const cycle = await prisma.payCycle.create({
      data: { name, payDay: day, userId: req.userId },
    });
    return res.status(201).json(cycle);
  } catch (error) {
    console.error("Erro ao criar ciclo de pagamento", error);
    return res.status(500).json({ message: "Erro ao criar ciclo" });
  }
});

router.put("/:id", async (req, res) => {
  const cycleId = Number(req.params.id);
  if (Number.isNaN(cycleId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.payDay !== undefined) {
    const day = parseInt(req.body.payDay, 10);
    if (Number.isNaN(day) || day < 1 || day > 31) {
      return res.status(400).json({ message: "Dia inválido" });
    }
    data.payDay = day;
  }

  try {
    const existing = await prisma.payCycle.findUnique({ where: { id: cycleId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Ciclo não encontrado" });
    }

    const updated = await prisma.payCycle.update({ where: { id: cycleId }, data });
    return res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar ciclo de pagamento", error);
    return res.status(500).json({ message: "Erro ao atualizar ciclo" });
  }
});

router.delete("/:id", async (req, res) => {
  const cycleId = Number(req.params.id);
  if (Number.isNaN(cycleId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const existing = await prisma.payCycle.findUnique({ where: { id: cycleId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ message: "Ciclo não encontrado" });
    }

    await prisma.payCycle.delete({ where: { id: cycleId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir ciclo de pagamento", error);
    return res.status(500).json({ message: "Erro ao excluir ciclo" });
  }
});

module.exports = router;
