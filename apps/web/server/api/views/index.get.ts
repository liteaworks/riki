import { db } from '#server/utils/db'
import { views } from '#server/db/schemas'
import { requireUser } from '#server/utils/session'
import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	return db
		.select()
		.from(views)
		.where(eq(views.userId, user.id))
		.orderBy(asc(views.position), asc(views.createdAt))
})
