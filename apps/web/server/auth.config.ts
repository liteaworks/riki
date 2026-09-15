import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { admin, username } from 'better-auth/plugins'
import { apiKey } from '@better-auth/api-key'

export default defineServerAuth({
	plugins: [admin(), apiKey(), username()],
	emailAndPassword: { enabled: true },
})
