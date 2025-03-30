import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env' });

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Migrations completed!');
  process.exit(0);
};

runMigrations().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
}); 