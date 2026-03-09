export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
}

export type LendingStatus = 'pending' | 'partially_paid' | 'settled';

export interface Lending {
  id: string;
  created_at: string;
  person_name: string;
  amount: number;
  amount_paid: number;
  status: LendingStatus;
  due_date: string | null;
  description: string;
}

export interface Borrowing {
  id: string;
  created_at: string;
  person_name: string;
  amount: number;
  amount_paid: number;
  status: LendingStatus;
  due_date: string | null;
  description: string;
}
