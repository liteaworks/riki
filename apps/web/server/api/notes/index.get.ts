import { db } from '#server/utils/db'
import { notes, spaces, user } from '#server/db/schemas'
import { listNotesQuerySchema, noteStatus, noteVisibility } from '#shared/types/note'
import { getSessionUser } from '#server/utils/session'
import { readQueryZod } from '#server/utils/validation'
import { and, desc, eq, getColumns, lt, ne, or } from 'drizzle-orm'

export function encodeNoteCursor(createdAt: Date, id: string): string {
	return `${createdAt.getTime()}:${id}`
}

export default defineEventHandler(async (event) => {
	const query = await readQueryZod(event, listNotesQuerySchema)
	const viewerId = (await getSessionUser(event))?.id ?? null

	const cursorFilter = query.cursor
		? or(
				lt(notes.createdAt, query.cursor.createdAt),
				and(eq(notes.createdAt, query.cursor.createdAt), lt(notes.id, query.cursor.id)),
			)
		: undefined

	const readable = viewerId
		? or(eq(notes.userId, viewerId), ne(notes.visibility, noteVisibility.private))
		: eq(notes.visibility, noteVisibility.public)

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
		.where(and(readable, cursorFilter, eq(notes.status, noteStatus.normal), eq(user.banned, false)))
		.orderBy(desc(notes.createdAt), desc(notes.id))
		.limit(query.limit + 1)

	const items = rows.slice(0, query.limit).map((row) => ({
		...row,
		spaceName: row.userId === viewerId ? row.spaceName : null,
	}))
	const last = items[items.length - 1]
	return {
		items,
		nextCursor:
			rows.length > query.limit && last ? encodeNoteCursor(last.createdAt, last.id) : null,
	}
})
