import { db } from '#server/utils/db'
import { notes, spaces } from '#server/db/schemas'
import { createNoteBodySchema } from '#shared/types/note'
import { resolveTagIdsForNames, tagLinkInserts } from '#server/utils/note-tags'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { newId } from '#shared/utils/id'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const body = await readBodyZod(event, createNoteBodySchema)

	if (body.spaceId) {
		const space = await db.select().from(spaces).where(eq(spaces.id, body.spaceId)).limit(1)
		if (!space.length) throw createError({ statusCode: 404, statusMessage: 'Space not found' })
	}

	const noteId = newId()
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
