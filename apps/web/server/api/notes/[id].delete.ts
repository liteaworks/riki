import { db } from '#server/utils/db'
import { noteTags, notes } from '#server/db/schemas'
import { requireUser } from '#server/utils/session'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const existing = await db
		.select({ id: notes.id })
		.from(notes)
		.where(and(eq(notes.id, id), eq(notes.userId, user.id)))
		.limit(1)
	if (!existing.length) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

	await db.batch([
		db.delete(noteTags).where(eq(noteTags.noteId, id)),
		db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, user.id))),
	])

	return { id }
})
