import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import { DATABASE_URL } from '$env/static/private';

const pool = mysql.createPool({
	uri: DATABASE_URL,
	waitForConnections: true,
	connectionLimit: 10
});

export const db = drizzle(pool, { schema, mode: 'default' });
