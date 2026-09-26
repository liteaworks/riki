import { db } from '#server/utils/db'
import { notes, spaces } from '#server/db/schemas'
import { listNotesQuerySchema } from '#shared/types/note'
import { requireUser } from '#server/utils/session'
import { readQueryZod } from '#server/utils/validation'
import { and, desc, eq, getTableColumns, gt, lt, or } from 'drizzle-orm'

export function encodeNoteCursor(createdAt: Date, id: string): string {
	return `${createdAt.getTime()}:${id}`
}

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const query = await readQueryZod(event, listNotesQuerySchema)

	const cursorFilter = query.cursor
		? or(
				lt(notes.createdAt, query.cursor.createdAt),
				and(eq(notes.createdAt, query.cursor.createdAt), lt(notes.id, query.cursor.id)),
			)
		: undefined

	const sinceFilter = query.since ? gt(notes.updatedAt, new Date(query.since)) : undefined

	const rows = await db
		.select({ ...getTableColumns(notes), spaceName: spaces.name })
		.from(notes)
		.leftJoin(spaces, eq(spaces.id, notes.spaceId))
		.where(and(eq(notes.userId, user.id), cursorFilter, sinceFilter))
		.orderBy(desc(notes.createdAt), desc(notes.id))
		.limit(query.limit + 1)

	const items = rows.slice(0, query.limit)
	const last = items[items.length - 1]
	return {
		items,
		nextCursor:
			rows.length > query.limit && last ? encodeNoteCursor(last.createdAt, last.id) : null,
	}
})
