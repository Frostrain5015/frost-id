import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'mysql',
	dbCredentials: {
		url: process.env.DATABASE_URL ?? 'mysql://root:@localhost:3306/frost_id'
	}
});
