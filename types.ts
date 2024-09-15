export interface ExpenseType {
  id: string;
  name: string;
  amount: string;
  percentage: string;
}

export interface IncomeType {
  id: string;
  name: string;
  amount: string;
}
export interface TaskType {
    id: string;
    name: string;
    due: string;
    budget: number;
    spent: number;
    target: number;
    status: number;
  };
