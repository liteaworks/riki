import { db } from '#server/utils/db'
import { auth } from '#server/utils/auth'
import { notes, spaces } from '#server/db/schemas'
import { createNoteBodySchema } from '#shared/types/note'
import { dedupeTagNames, ensureTags, resolveTagIds, tagLinkInserts } from '#server/utils/tags'
import { newId } from '#shared/utils/id'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const body = await readValidatedBody(event, (data: unknown) => {
		const result = createNoteBodySchema.safeParse(data)
		if (!result.success) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Validation failed',
				data: z.flattenError(result.error),
			})
		}
		return result.data
	})

	if (body.spaceId) {
		const space = await db.select().from(spaces).where(eq(spaces.id, body.spaceId)).limit(1)
		if (!space.length) throw createError({ statusCode: 404, statusMessage: 'Space not found' })
	}

	const noteId = newId()
	const tagNames = dedupeTagNames(body.tagNames ?? [])
	await ensureTags(session.user.id, tagNames)
	const tagIds = await resolveTagIds(session.user.id, tagNames)

	const [noteRows] = await db.batch([
		db
			.insert(notes)
			.values({
				id: noteId,
				content: body.content,
				userId: session.user.id,
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
