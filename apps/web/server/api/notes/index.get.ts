import { db } from '#server/utils/db'
import { notes } from '#server/db/schemas'
import { listNotesQuerySchema } from '#shared/types/note'
import { requireUser } from '#server/utils/session'
import { readQueryZod } from '#server/utils/validation'
import { and, desc, eq, lt, or } from 'drizzle-orm'

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

	const rows = await db
		.select()
		.from(notes)
		.where(and(eq(notes.userId, user.id), cursorFilter))
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
