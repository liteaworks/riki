import { db } from '#server/utils/db'
import { views } from '#server/db/schemas'
import { updateViewBodySchema } from '#shared/types/view'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const body = await readBodyZod(event, updateViewBodySchema)

	const [updated] = await db
		.update(views)
		.set({
			...(body.name !== undefined && { name: body.name }),
			...(body.filter !== undefined && { filter: body.filter }),
		})
		.where(and(eq(views.id, id), eq(views.userId, user.id)))
		.returning()

	if (!updated) throw createError({ statusCode: 404, statusMessage: 'View not found' })
	return updated
})
