import { db } from '#server/utils/db'
import { auth } from '#server/utils/auth'
import { notes, noteTags, tags } from '#server/db/schemas'
import { listTagsQuerySchema } from '#shared/types/tag'
import { and, asc, desc, eq, like, sql } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const query = await getValidatedQuery(event, (data: unknown) => {
		const result = listTagsQuerySchema.safeParse(data)
		if (!result.success) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Validation failed',
				data: z.flattenError(result.error),
			})
		}
		return result.data
	})
	const keyword = query.q?.replace(/[%_]/g, '')
	const scope = keyword
		? and(eq(tags.userId, session.user.id), like(tags.name, `%${keyword}%`))
		: eq(tags.userId, session.user.id)

	const rows = await db
		.select({
			id: tags.id,
			name: tags.name,
			usageCount: sql<number>`count(${notes.id})`,
		})
		.from(tags)
		.leftJoin(noteTags, eq(noteTags.tagId, tags.id))
		.leftJoin(notes, and(eq(notes.id, noteTags.noteId), eq(notes.userId, session.user.id)))
		.where(scope)
		.groupBy(tags.id)
		.orderBy(desc(sql`count(${notes.id})`), asc(tags.name))
		.limit(query.limit)

	return rows
})
