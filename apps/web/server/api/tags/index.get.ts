import { db } from '#server/utils/db'
import { notes, noteTags, tags } from '#server/db/schemas'
import { listTagsQuerySchema } from '#shared/types/tag'
import { requireUser } from '#server/utils/session'
import { readQueryZod } from '#server/utils/validation'
import { and, asc, desc, eq, like, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const query = await readQueryZod(event, listTagsQuerySchema)

	const keyword = query.q?.replace(/[%_]/g, '')
	const scope = keyword
		? and(eq(tags.userId, user.id), like(tags.name, `%${keyword}%`))
		: eq(tags.userId, user.id)

	const rows = await db
		.select({
			id: tags.id,
			name: tags.name,
			usageCount: sql<number>`count(${notes.id})`,
		})
		.from(tags)
		.leftJoin(noteTags, eq(noteTags.tagId, tags.id))
		.leftJoin(notes, and(eq(notes.id, noteTags.noteId), eq(notes.userId, user.id)))
		.where(scope)
		.groupBy(tags.id)
		.orderBy(desc(sql`count(${notes.id})`), asc(tags.name))
		.limit(query.limit)

	return rows
})
