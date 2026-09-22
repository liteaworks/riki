import { defaultLocale, locales } from './i18n/locales'

export default defineNuxtConfig({
	modules: ['@nuxt/ui', '@nuxtjs/i18n', '@vueuse/nuxt', '@pinia/nuxt', '@comark/nuxt'],
	css: ['~/assets/css/main.css'],
	i18n: {
		strategy: 'no_prefix',
		defaultLocale,
		locales,
	},
	icon: {
		clientBundle: {
			scan: true,
		},
	},
	routeRules: {
		'/auth/**': { appLayout: 'auth' },
		'/settings/**': { appLayout: 'settings' },
	},
	ssr: true,
	vite: {
		clearScreen: false,
		envPrefix: ['VITE_', 'TAURI_'],
		server: {
			strictPort: true,
			ws: {
				protocol: 'ws',
				host: '0.0.0.0',
				port: 1421,
			},
			watch: {
				ignored: ['**/src-tauri/**'],
			},
		},
	},
	ui: {
		fonts: false,
		prose: true,
	},
	devtools: {
		enabled: true,
	},
	compatibilityDate: '2026-07-30',
	// future: {
	// 	compatibilityVersion: 5,
	// },
})
