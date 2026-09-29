import { db } from '#server/utils/db'
import { sidebar } from '#server/db/schemas'
import { requireUser } from '#server/utils/session'
import { compactSidebar } from '#server/utils/sidebar'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const [removed] = await db
		.delete(sidebar)
		.where(and(eq(sidebar.id, id), eq(sidebar.userId, user.id)))
		.returning()

	if (!removed) throw createError({ statusCode: 404, statusMessage: 'Sidebar item not found' })
	await compactSidebar(user.id)
	return { id }
})
