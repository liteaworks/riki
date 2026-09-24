import { db } from '#server/utils/db'
import { noteTags, notes } from '#server/db/schemas'
import { updateNoteBodySchema } from '#shared/types/note'
import { resolveTagIdsForNames, tagLinkInserts } from '#server/utils/note-tags'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const body = await readBodyZod(event, updateNoteBodySchema)

	const [updated] = await db
		.update(notes)
		.set({
			...(body.content !== undefined && { content: body.content }),
			...(body.status !== undefined && { status: body.status }),
		})
		.where(and(eq(notes.id, id), eq(notes.userId, user.id)))
		.returning()
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

	if (body.tagNames !== undefined) {
		const tagIds = await resolveTagIdsForNames(user.id, body.tagNames)
		await db.batch([
			db.delete(noteTags).where(eq(noteTags.noteId, id)),
			...tagLinkInserts(id, tagIds),
		])
	}

	return updated
})
