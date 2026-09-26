import { db } from '#server/utils/db'
import { noteTags, notes, spaces } from '#server/db/schemas'
import { syncNotesBodySchema } from '#shared/types/note'
import type { SyncNote } from '#shared/types/note'
import { resolveTagIdMap, tagLinkInserts } from '#server/utils/note-tags'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { and, eq, inArray } from 'drizzle-orm'

// Ids are client-minted, so a replayed outbox row must upsert rather than
// duplicate. Ownership is checked up front because `onConflictDoUpdate` targets
// the primary key: without the guard a client could claim another user's note
// id and have its own userId written over it.
export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const body = await readBodyZod(event, syncNotesBodySchema)

	const incoming = new Map(body.notes.map((note) => [note.id, note]))
	const existing = await db
		.select({ id: notes.id, userId: notes.userId, updatedAt: notes.updatedAt })
		.from(notes)
		.where(inArray(notes.id, [...incoming.keys()]))

	const owned = new Map(
		existing.filter((row) => row.userId === user.id).map((row) => [row.id, row.updatedAt]),
	)
	const rejected: string[] = []

	const applicable = body.notes.filter((note) => {
		if (existing.some((row) => row.id === note.id && row.userId !== user.id)) {
			rejected.push(note.id)
			return false
		}
		const stored = owned.get(note.id)
		return !stored || note.updatedAt > stored.getTime()
	})

	if (!applicable.length) return { applied: [], rejected }

	const spaceIds = applicable.map((note) => note.spaceId).filter((id): id is string => !!id)
	if (spaceIds.length) {
		const ownedSpaces = await db
			.select({ id: spaces.id })
			.from(spaces)
			.where(and(eq(spaces.userId, user.id), inArray(spaces.id, spaceIds)))
		const known = new Set(ownedSpaces.map((row) => row.id))
		for (const note of applicable) {
			if (note.spaceId && !known.has(note.spaceId)) {
				throw createError({ statusCode: 404, statusMessage: 'Space not found' })
			}
		}
	}

	// Resolved once for the whole batch: looping per note would cost a batch plus
	// a select each, which blows past D1's per-invocation query budget.
	const tagIdByName = await resolveTagIdMap(
		user.id,
		applicable.flatMap((note) => note.tagNames ?? []),
	)

	function tagIdsFor(note: SyncNote) {
		return (note.tagNames ?? []).map((name) => {
			const id = tagIdByName.get(name.toLowerCase())
			if (!id) throw createError({ statusCode: 500, statusMessage: 'Failed to resolve tag' })
			return id
		})
	}

	const toUpsert = (note: SyncNote) =>
		db
			.insert(notes)
			.values({
				id: note.id,
				userId: user.id,
				content: note.content,
				spaceId: note.spaceId,
				visibility: note.visibility,
				status: note.status,
				createdAt: new Date(note.updatedAt),
				updatedAt: new Date(note.updatedAt),
			})
			.onConflictDoUpdate({
				target: notes.id,
				set: {
					content: note.content,
					spaceId: note.spaceId,
					visibility: note.visibility,
					status: note.status,
					updatedAt: new Date(note.updatedAt),
				},
			})

	// `db.batch` needs a non-empty tuple, so the first note is passed literally
	// rather than through the spread.
	const [head, ...tail] = applicable
	if (!head) return { applied: [], rejected }

	await db.batch([
		toUpsert(head),
		...tail.map(toUpsert),
		// Delete links before re-inserting so a tag removal actually sticks.
		...applicable.map((note) => db.delete(noteTags).where(eq(noteTags.noteId, note.id))),
		...applicable.flatMap((note) => tagLinkInserts(note.id, tagIdsFor(note))),
	])

	return { applied: applicable.map((note) => note.id), rejected }
})
