import { db } from '#server/utils/db'
import { notes, spaces } from '#server/db/schemas'
import { noteStatus } from '#shared/types/note'
import { requireUser } from '#server/utils/session'
import { asc, and, eq, inArray, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const rows = await db
		.select({
			id: spaces.id,
			name: spaces.name,
			noteCount: sql<number>`count(${notes.id})`,
		})
		.from(spaces)
		.leftJoin(
			notes,
			and(
				eq(notes.spaceId, spaces.id),
				eq(notes.userId, user.id),
				inArray(notes.status, [noteStatus.normal, noteStatus.pinned]),
			),
		)
		.where(eq(spaces.userId, user.id))
		.groupBy(spaces.id)
		.orderBy(asc(spaces.name))

	return rows
})
