import { auth } from '#server/utils/auth'

export async function getSessionUser(event: { headers: Headers }) {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	return session?.user ?? null
}

export async function requireUser(event: { headers: Headers }) {
	const user = await getSessionUser(event)
	if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	return user
}
