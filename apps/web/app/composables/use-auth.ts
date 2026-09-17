import { createAuthClient } from 'better-auth/vue'
import { adminClient, usernameClient } from 'better-auth/client/plugins'
import { apiKeyClient } from '@better-auth/api-key/client'

export function useAuth() {
	const url = useRequestURL()
	const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

	return createAuthClient({
		baseURL: url.origin,
		fetchOptions: { headers },
		plugins: [adminClient(), apiKeyClient(), usernameClient()],
	})
}
