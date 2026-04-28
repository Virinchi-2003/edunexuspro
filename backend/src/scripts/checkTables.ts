import { turso } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const result = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log(JSON.stringify(result.rows, null, 2));
}

check();
