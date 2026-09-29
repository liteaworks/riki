import { db } from '#server/utils/db'
import { views } from '#server/db/schemas'
import { createViewBodySchema } from '#shared/types/view'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const body = await readBodyZod(event, createViewBodySchema)

	const [max] = await db
		.select({ position: sql<number | null>`max(${views.position})` })
		.from(views)
		.where(eq(views.userId, user.id))

	const [view] = await db
		.insert(views)
		.values({
			userId: user.id,
			name: body.name,
			filter: body.filter,
			position: (max?.position ?? -1) + 1,
		})
		.returning()
	if (!view) throw createError({ statusCode: 500, statusMessage: 'View not created' })

	setResponseStatus(event, 201)
	setResponseHeader(event, 'Location', `/api/views/${view.id}`)
	return view
})
