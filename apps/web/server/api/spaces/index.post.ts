import { db } from '#server/utils/db'
import { spaces } from '#server/db/schemas'
import { createSpaceBodySchema } from '#shared/types/space'
import { requireUser } from '#server/utils/session'
import { readBodyZod } from '#server/utils/validation'
import { newId } from '#shared/utils/id'

export default defineEventHandler(async (event) => {
	const user = await requireUser(event)
	const body = await readBodyZod(event, createSpaceBodySchema)

	const spaceId = newId()
	const [space] = await db.batch([
		db.insert(spaces).values({ id: spaceId, name: body.name, userId: user.id }).returning(),
	])

	setResponseStatus(event, 201)
	setResponseHeader(event, 'Location', `/api/spaces/${spaceId}`)
	return space
})
