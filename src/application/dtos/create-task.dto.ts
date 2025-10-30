export type CreateTaskInput = {
  source: string;
};

export type CreateTaskOutput = {
  taskId: string;
  price: number;
  status: 'pending' | 'completed' | 'failed';
};
