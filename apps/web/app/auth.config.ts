import { defineClientAuth } from '@nuxtjs/better-auth/config'
import { adminClient, usernameClient } from 'better-auth/client/plugins'
import { apiKeyClient } from '@better-auth/api-key/client'

export default defineClientAuth({
	plugins: [adminClient(), apiKeyClient(), usernameClient()],
})
