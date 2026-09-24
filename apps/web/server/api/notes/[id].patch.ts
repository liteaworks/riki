import { db } from '#server/utils/db'
import { auth } from '#server/utils/auth'
import { notes } from '#server/db/schemas'
import { updateNoteBodySchema } from '#shared/types/note'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const body = await readValidatedBody(event, (data: unknown) => {
		const result = updateNoteBodySchema.safeParse(data)
		if (!result.success) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Validation failed',
				data: z.flattenError(result.error),
			})
		}
		return result.data
	})

	const [updated] = await db
		.update(notes)
		.set({ status: body.status })
		.where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
		.returning()
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

	return updated
})
