import { db } from '#server/utils/db'
import { auth } from '#server/utils/auth'
import { noteTags, notes } from '#server/db/schemas'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const existing = await db
		.select({ id: notes.id })
		.from(notes)
		.where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
		.limit(1)
	if (!existing.length) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

	await db.batch([
		db.delete(noteTags).where(eq(noteTags.noteId, id)),
		db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, session.user.id))),
	])

	return { id }
})
