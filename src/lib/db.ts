import Dexie, { type Table } from 'dexie';
import type { Transaction, Lending, Borrowing } from '../types/database.types';

export class AppDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  lendings!: Table<Lending, string>;
  borrowings!: Table<Borrowing, string>;

  constructor() {
    super('ChillAraiDB');
    this.version(1).stores({
      transactions: 'id, created_at, updated_at, deleted, type, category',
      lendings: 'id, created_at, updated_at, deleted, person_name, status',
      borrowings: 'id, created_at, updated_at, deleted, person_name, status',
    });
  }
}

export const db = new AppDatabase();

/** Migrate from old localStorage keys into IndexedDB (runs once) */
export async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem('chill_arai_migrated_v2');
  if (migrated) return;

  const now = new Date().toISOString();

  const txRaw = localStorage.getItem('moneyflow_tx');
  if (txRaw) {
    const txs: any[] = JSON.parse(txRaw);
    await db.transactions.bulkPut(
      txs.map((t) => ({ ...t, updated_at: t.updated_at || now, deleted: false }))
    );
  }

  const lRaw = localStorage.getItem('moneyflow_lendings');
  if (lRaw) {
    const ls: any[] = JSON.parse(lRaw);
    await db.lendings.bulkPut(
      ls.map((l) => ({ ...l, updated_at: l.updated_at || now, deleted: false }))
    );
  }

  const bRaw = localStorage.getItem('moneyflow_borrowings');
  if (bRaw) {
    const bs: any[] = JSON.parse(bRaw);
    await db.borrowings.bulkPut(
      bs.map((b) => ({ ...b, updated_at: b.updated_at || now, deleted: false }))
    );
  }

  localStorage.setItem('chill_arai_migrated_v2', 'true');
}
