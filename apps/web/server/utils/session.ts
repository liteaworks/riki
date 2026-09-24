import { auth } from '#server/utils/auth'

export async function requireUser(event: { headers: Headers }) {
	const session = await auth.api.getSession({
		headers: event.headers,
	})
	if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	return session.user
}
