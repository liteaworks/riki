import { db } from '#server/utils/db'
import { noteTags, notes, spaces, user } from '#server/db/schemas'
import { listNotesQuerySchema, noteStatus, noteVisibility } from '#shared/types/note'
import { getSessionUser } from '#server/utils/session'
import { readQueryZod } from '#server/utils/validation'
import {
	and,
	desc,
	eq,
	exists,
	getColumns,
	inArray,
	isNull,
	like,
	lt,
	ne,
	or,
	sql,
} from 'drizzle-orm'

export function encodeNoteCursor(createdAt: Date, id: string, pinned: boolean): string {
	return `${createdAt.getTime()}:${id}:${pinned ? 1 : 0}`
}

export default defineEventHandler(async (event) => {
	const query = await readQueryZod(event, listNotesQuerySchema)
	const viewerId = (await getSessionUser(event))?.id ?? null

	const pinnedFlag = sql<number>`case when ${notes.status} = ${noteStatus.pinned} then 1 else 0 end`

	const cursorFilter = query.cursor
		? or(
				lt(pinnedFlag, query.cursor.pinned ? 1 : 0),
				and(
					eq(pinnedFlag, query.cursor.pinned ? 1 : 0),
					or(
						lt(notes.createdAt, query.cursor.createdAt),
						and(eq(notes.createdAt, query.cursor.createdAt), lt(notes.id, query.cursor.id)),
					),
				),
			)
		: undefined

	const readable = viewerId
		? or(eq(notes.userId, viewerId), ne(notes.visibility, noteVisibility.private))
		: eq(notes.visibility, noteVisibility.public)

	const statusFilter = query.pinnedOnly
		? eq(notes.status, noteStatus.pinned)
		: inArray(notes.status, [noteStatus.normal, noteStatus.pinned])

	const rows = await db
		.select({
			...getColumns(notes),
			spaceName: spaces.name,
			authorName: user.name,
			authorImage: user.image,
		})
		.from(notes)
		.leftJoin(spaces, eq(spaces.id, notes.spaceId))
		.innerJoin(user, eq(user.id, notes.userId))
		.where(
			and(
				cursorFilter,
				readable,
				statusFilter,
				eq(user.banned, false),
				query.noSpace ? isNull(notes.spaceId) : undefined,
				query.spaceId ? eq(notes.spaceId, query.spaceId) : undefined,
				query.visibility?.length ? inArray(notes.visibility, query.visibility) : undefined,
				query.q ? like(notes.content, `%${query.q.replace(/[%_]/g, '')}%`) : undefined,
				query.tagIds?.length
					? and(
							...query.tagIds.map((tagId) =>
								exists(
									db
										.select({ one: sql`1` })
										.from(noteTags)
										.where(and(eq(noteTags.noteId, notes.id), eq(noteTags.tagId, tagId))),
								),
							),
						)
					: undefined,
			),
		)
		.orderBy(desc(pinnedFlag), desc(notes.createdAt), desc(notes.id))
		.limit(query.limit + 1)

	const page = rows.slice(0, query.limit)
	const tagRows = page.length
		? await db
				.select({ noteId: noteTags.noteId, tagId: noteTags.tagId })
				.from(noteTags)
				.where(
					inArray(
						noteTags.noteId,
						page.map((row) => row.id),
					),
				)
		: []
	const tagIdsByNote = new Map<string, string[]>()
	for (const row of tagRows) {
		const list = tagIdsByNote.get(row.noteId)
		if (list) list.push(row.tagId)
		else tagIdsByNote.set(row.noteId, [row.tagId])
	}
	const items = page.map((row) => ({
		...row,
		spaceName: row.userId === viewerId ? row.spaceName : null,
		tagIds: tagIdsByNote.get(row.id) ?? [],
	}))
	const last = items[items.length - 1]
	return {
		items,
		nextCursor:
			rows.length > query.limit && last
				? encodeNoteCursor(last.createdAt, last.id, last.status === noteStatus.pinned)
				: null,
	}
})
