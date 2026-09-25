import { db } from '#server/utils/db'
import { spaces } from '#server/db/schemas'
import { updateSpaceBodySchema } from '#shared/types/space'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const body = await readBodyZod(event, updateSpaceBodySchema)

	const [updated] = await db
		.update(spaces)
		.set({ name: body.name })
		.where(and(eq(spaces.id, id), eq(spaces.userId, user.id)))
		.returning()
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'Space not found' })

	return updated
})
