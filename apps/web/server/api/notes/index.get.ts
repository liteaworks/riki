import { db } from '#server/utils/db'
import { auth } from '#server/utils/auth'
import { notes } from '#server/db/schemas'
import { listNotesQuerySchema } from '#shared/types/note'
import { and, desc, eq, lt, or } from 'drizzle-orm'
import { z } from 'zod'

export function encodeNoteCursor(createdAt: Date, id: string): string {
	return `${createdAt.getTime()}:${id}`
}

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const query = await getValidatedQuery(event, (data: unknown) => {
		const result = listNotesQuerySchema.safeParse(data)
		if (!result.success) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Validation failed',
				data: z.flattenError(result.error),
			})
		}
		return result.data
	})

	const cursorFilter = query.cursor
		? or(
				lt(notes.createdAt, query.cursor.createdAt),
				and(eq(notes.createdAt, query.cursor.createdAt), lt(notes.id, query.cursor.id)),
			)
		: undefined

	const rows = await db
		.select()
		.from(notes)
		.where(and(eq(notes.userId, session.user.id), cursorFilter))
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
