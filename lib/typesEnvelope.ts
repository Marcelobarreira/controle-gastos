export type AllocationDTO = {
  id: number;
  envelopeId: number;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type EnvelopeDTO = {
  id: number;
  title: string;
  budget: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  allocations?: AllocationDTO[];
};
