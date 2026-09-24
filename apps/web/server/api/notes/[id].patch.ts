import { db } from '#server/utils/db'
import { auth } from '#server/utils/auth'
import { noteTags, notes } from '#server/db/schemas'
import { updateNoteBodySchema } from '#shared/types/note'
import { dedupeTagNames, ensureTags, resolveTagIds, tagLinkInserts } from '#server/utils/note-tags'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const body = await readValidatedBody(event, (data: unknown) => {
		const result = updateNoteBodySchema.safeParse(data)
		if (!result.success) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Validation failed',
				data: z.flattenError(result.error),
			})
		}
		return result.data
	})

	const [updated] = await db
		.update(notes)
		.set({
			...(body.content !== undefined && { content: body.content }),
			...(body.status !== undefined && { status: body.status }),
		})
		.where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
		.returning()
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

	if (body.tagNames !== undefined) {
		const tagNames = dedupeTagNames(body.tagNames)
		await ensureTags(session.user.id, tagNames)
		const tagIds = await resolveTagIds(session.user.id, tagNames)
		await db.batch([
			db.delete(noteTags).where(eq(noteTags.noteId, id)),
			...tagLinkInserts(id, tagIds),
		])
	}

	return updated
})
