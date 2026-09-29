import { db } from '#server/utils/db'
import { sidebar } from '#server/db/schemas'
import { requireUser } from '#server/utils/session'
import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	return db.select().from(sidebar).where(eq(sidebar.userId, user.id)).orderBy(asc(sidebar.position))
})
