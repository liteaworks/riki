import { db } from '#server/utils/db'
import { noteTags, notes, spaces } from '#server/db/schemas'
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

	if (body.spaceId) {
		const [owned] = await db
			.select({ id: spaces.id })
			.from(spaces)
			.where(and(eq(spaces.id, body.spaceId), eq(spaces.userId, user.id)))
			.limit(1)
		if (!owned) throw createError({ statusCode: 404, statusMessage: 'Space not found' })
	}

	const [current] = await db
		.select()
		.from(notes)
		.where(and(eq(notes.id, id), eq(notes.userId, user.id)))
		.limit(1)
	if (!current) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

	// Last-write-wins. The client stamp is clamped to server time, so a device
	// with a wrong clock cannot pin a note in the future: the sync point advances
	// to the newest timestamp the client has seen, and a future-dated note would
	// make every later delta pull return nothing. An older write is answered with
	// the winning row so the caller converges instead of retrying forever.
	if (body.updatedAt !== undefined) {
		const stamp = Math.min(body.updatedAt, Date.now())
		if (stamp <= current.updatedAt.getTime()) return current
	}

	const [updated] = await db
		.update(notes)
		.set({
			...(body.content !== undefined && { content: body.content }),
			...(body.spaceId !== undefined && { spaceId: body.spaceId }),
			...(body.status !== undefined && { status: body.status }),
			...(body.updatedAt !== undefined && {
				updatedAt: new Date(Math.min(body.updatedAt, Date.now())),
			}),
		})
		.where(and(eq(notes.id, id), eq(notes.userId, user.id)))
		.returning()

	if (body.tagNames !== undefined) {
		const tagIds = await resolveTagIdsForNames(user.id, body.tagNames)
		await db.batch([
			db.delete(noteTags).where(eq(noteTags.noteId, id)),
			...tagLinkInserts(id, tagIds),
		])
	}

	return updated
})
