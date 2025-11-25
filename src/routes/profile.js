const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

function formatDecimal(value) {
  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return value === null || value === undefined ? null : Number(value);
}

router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, salary: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.json({ ...user, salary: formatDecimal(user.salary) });
  } catch (error) {
    console.error("Erro ao buscar usuário", error);
    return res.status(500).json({ message: "Erro interno ao buscar usuário" });
  }
});

router.put("/salary", async (req, res) => {
  const { salary } = req.body;
  if (salary === undefined || salary === null) {
    return res.status(400).json({ message: "Salário é obrigatório" });
  }

  const parsed = parseFloat(salary);
  if (Number.isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ message: "Salário inválido" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { salary: parsed },
      select: { id: true, name: true, email: true, salary: true },
    });

    return res.json({ ...updated, salary: formatDecimal(updated.salary) });
  } catch (error) {
    console.error("Erro ao atualizar salário", error);
    return res.status(500).json({ message: "Erro interno ao atualizar salário" });
  }
});

module.exports = router;
