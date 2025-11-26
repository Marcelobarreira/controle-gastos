export type User = {
  id: number;
  name: string;
  email: string;
  salary?: number | null;
};

export type Expense = {
  id: number;
  description: string;
  amount: number;
  category?: string | null;
  date: string;
  userId: number;
  payCycleId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Obligation = {
  id: number;
  title: string;
  amount: number;
  category?: string | null;
  dueDay: number;
  userId: number;
  payCycleId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PayCycle = {
  id: number;
  name: string;
  payDay: number;
  salaryAmount?: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type FutureEntry = {
  id: number;
  title: string;
  amount: number;
  category?: string | null;
  dueDate: string;
  type: "expense" | "income";
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type ExtraIncome = {
  id: number;
  title: string;
  amount: number;
  date: string;
  userId: number;
  payCycleId?: number | null;
  createdAt: string;
  updatedAt: string;
};
