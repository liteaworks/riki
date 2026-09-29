import { db } from '#server/utils/db'
import { sidebar, views } from '#server/db/schemas'
import { requireUser } from '#server/utils/session'
import { compactSidebar } from '#server/utils/sidebar'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const [view] = await db
		.delete(views)
		.where(and(eq(views.id, id), eq(views.userId, user.id)))
		.returning()
	if (!view) throw createError({ statusCode: 404, statusMessage: 'View not found' })

	await db
		.delete(sidebar)
		.where(and(eq(sidebar.userId, user.id), eq(sidebar.kind, 'view'), eq(sidebar.targetId, id)))
	await compactSidebar(user.id)

	return { id }
})
