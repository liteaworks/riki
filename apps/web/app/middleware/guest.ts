// Redirect signed-in users away from guest-only pages.
export default defineNuxtRouteMiddleware(async () => {
	const { data } = await useAuth().getSession({
		fetchOptions: {
			headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
		},
	})
	if (data?.user) return navigateTo('/')
})
