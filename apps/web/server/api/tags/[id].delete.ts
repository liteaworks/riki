import { db } from '#server/utils/db'
import { noteTags, tags } from '#server/db/schemas'
import { requireUser } from '#server/utils/session'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const scope = and(eq(tags.id, id), eq(tags.userId, user.id))

	const [existing] = await db.select({ id: tags.id }).from(tags).where(scope).limit(1)
	if (!existing) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

	await db.batch([db.delete(noteTags).where(eq(noteTags.tagId, id)), db.delete(tags).where(scope)])

	return { id }
})
