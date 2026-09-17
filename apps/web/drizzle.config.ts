import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	out: './drizzle',
	schema: './server/db/schemas/index.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: 'file:local.db',
	},
})
