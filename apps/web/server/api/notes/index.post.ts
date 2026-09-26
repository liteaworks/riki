import { db } from '#server/utils/db'
import { notes, spaces } from '#server/db/schemas'
import { createNoteBodySchema } from '#shared/types/note'
import { resolveTagIdsForNames, tagLinkInserts } from '#server/utils/note-tags'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { newId } from '#shared/utils/id'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const body = await readBodyZod(event, createNoteBodySchema)

	if (body.spaceId) {
		const [owned] = await db
			.select({ id: spaces.id })
			.from(spaces)
			.where(and(eq(spaces.id, body.spaceId), eq(spaces.userId, user.id)))
			.limit(1)
		if (!owned) throw createError({ statusCode: 404, statusMessage: 'Space not found' })
	}

	// A client-minted id makes this endpoint retryable: the same create replayed
	// after a dropped response returns the row it already wrote. The ownership
	// check comes first so an id belonging to someone else is indistinguishable
	// from one that does not exist.
	if (body.id) {
		const [existing] = await db
			.select()
			.from(notes)
			.where(and(eq(notes.id, body.id), eq(notes.userId, user.id)))
			.limit(1)
		if (existing) return existing
		const [foreign] = await db
			.select({ id: notes.id })
			.from(notes)
			.where(eq(notes.id, body.id))
			.limit(1)
		if (foreign) throw createError({ statusCode: 404, statusMessage: 'Note not found' })
	}

	const noteId = body.id ?? newId()
	const tagIds = await resolveTagIdsForNames(user.id, body.tagNames ?? [])

	const [noteRows] = await db.batch([
		db
			.insert(notes)
			.values({
				id: noteId,
				content: body.content,
				userId: user.id,
				spaceId: body.spaceId,
				visibility: body.visibility,
				status: body.status,
			})
			.returning(),
		...tagLinkInserts(noteId, tagIds),
	])

	setResponseStatus(event, 201)
	setResponseHeader(event, 'Location', `/api/notes/${noteId}`)
	return noteRows[0]
})
