import { createAuthClient } from 'better-auth/vue'
import { adminClient, usernameClient } from 'better-auth/client/plugins'
import { apiKeyClient } from '@better-auth/api-key/client'

function createClient(headers?: Record<string, string | undefined>) {
	const cleanHeaders = headers
		? Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined))
		: undefined
	return createAuthClient({
		baseURL: useRequestURL().origin,
		fetchOptions: cleanHeaders ? { headers: cleanHeaders } : undefined,
		plugins: [adminClient(), apiKeyClient(), usernameClient()],
	})
}

type AuthClient = ReturnType<typeof createClient>

// Client-side singleton so `useSession()` state is shared across components.
// Server-side keeps a per-request instance to forward cookies correctly.
let clientInstance: AuthClient | undefined

export function useAuth(): AuthClient {
	if (import.meta.server) return createClient(useRequestHeaders(['cookie']))
	if (!clientInstance) clientInstance = createClient()
	return clientInstance
}
