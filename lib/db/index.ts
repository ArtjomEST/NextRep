import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Add it to your Vercel project environment variables (Settings → Environment Variables).',
      );
    }
    // #region agent log
    fetch('http://127.0.0.1:7492/ingest/705d0b4d-7333-4e4f-a376-a6c97e2a6b2e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'974076'},body:JSON.stringify({sessionId:'974076',location:'lib/db/index.ts:getDb',message:'Lazy DB init',data:{urlDefined:!!url},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
