import { db } from '#server/utils/db'
import { sidebar } from '#server/db/schemas'
import { reorderSidebarBodySchema } from '#shared/types/view'
import { requireUser } from '#server/utils/session'
import { reorderSidebar } from '#server/utils/sidebar'
import { readBodyZod } from '#server/utils/validation'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)

	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'Validation failed' })

	const body = await readBodyZod(event, reorderSidebarBodySchema)

	if (!(await reorderSidebar(user.id, id, body.position))) {
		throw createError({ statusCode: 404, statusMessage: 'Sidebar item not found' })
	}

	const [moved] = await db
		.select()
		.from(sidebar)
		.where(and(eq(sidebar.id, id), eq(sidebar.userId, user.id)))
		.limit(1)
	return moved
})
