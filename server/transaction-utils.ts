import { db } from './db';

export async function withTransaction(fn: (trx: typeof db) => Promise<any>) {
  // Drizzle ORM does not have a built-in transaction API in all versions, so this is a placeholder.
  // If using drizzle-orm >=0.29, you can use db.transaction(async (trx) => { ... })
  if (typeof db.transaction === 'function') {
    return db.transaction(fn);
  } else {
    // Fallback: just run the function (no real transaction)
    return fn(db);
  }
}
